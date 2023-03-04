import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { RoleEnum } from 'src/role/role.enum';
import * as crypto from 'crypto';
import { Role } from 'src/role/entities/role.entity';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { UserService } from 'src/user/user.service';
import { ForgotService } from 'src/forgot/forgot.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UserService,
    private forgotService: ForgotService,
    private mailService: MailService,
  ) {}

  async validateLogin(
    loginDto: AuthEmailLoginDto,
    onlyAdmin: boolean,
  ): Promise<{ token: string; user: User }> {
    const user = await this.usersService.findOne({
      email: loginDto.email,
    });

    if (
      !user ||
      (user && user.role.id !== (onlyAdmin ? RoleEnum.admin : RoleEnum.user))
    ) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'notFound',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (isValidPassword) {
      const token = await this.jwtService.sign({
        id: user.id,
        role: user.role,
      });

      return { token, user: user };
    } else {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            password: 'incorrectPassword',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    await this.usersService.create({
      ...dto,
      email: dto.email,
      role: {
        id: RoleEnum.user,
      } as Role,
      hash,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOne({
      email,
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailNotExists',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } else {
      const hash = crypto
        .createHash('sha256')
        .update(randomStringGenerator())
        .digest('hex');
      await this.forgotService.create({
        hash,
        user,
      });

      await this.mailService.forgotPassword({
        to: email,
        data: {
          hash,
        },
      });
    }
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    const forgot = await this.forgotService.findOne({
      where: {
        hash,
      },
    });

    if (!forgot) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: `notFound`,
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const user = forgot.user;
    user.password = password;
    await user.save();
    await this.forgotService.softDelete(forgot.id);
  }

  async me(user: User): Promise<User> {
    return this.usersService.findOne({
      id: user.id,
    });
  }
}
