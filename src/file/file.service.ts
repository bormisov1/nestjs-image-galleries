import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import { RoleEnum } from '../role/role.enum';

@Injectable()
export class FileService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: number,
  ): Promise<FileEntity> {
    if (!file) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            file: 'selectFile',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.fileRepository.save(
      this.fileRepository.create({
        owner: userId,
        originalName: file.originalname,
        name: file.path.split('/').pop(),
      }),
    );
  }

  async getFileRowById(
    id: string,
    userId: number,
    userRoleId: RoleEnum,
  ): Promise<FileEntity> {
    const fileRow = await this.fileRepository.findOne({
      where: { id },
      loadRelationIds: true,
    });
    if (
      !fileRow ||
      (userId !== fileRow.owner && userRoleId !== RoleEnum.admin)
    ) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            file: 'fileUnavailable',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return fileRow;
  }

  async updateFile(
    id: string,
    file: Express.Multer.File,
    userId: number,
    userRoleId: RoleEnum,
  ): Promise<void> {
    const updateResult = await this.fileRepository
      .createQueryBuilder()
      .update(FileEntity)
      .set({ originalName: file.originalname })
      .where('id = :id', { id })
      .returning(['owner', 'name'])
      .execute();
    const updatedRow = updateResult.raw[0];
    if (
      !updateResult.affected ||
      (userId !== updatedRow.ownerId && userRoleId !== RoleEnum.admin)
    ) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            file: 'fileUnavailable',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return fs.writeFile(`files/${userId}/${updatedRow.name}`, file.buffer, {
      flag: 'w',
    });
  }

  async deleteFileById(
    id: string,
    userId: number,
    userRoleId: RoleEnum,
  ): Promise<void> {
    let queryBuilder = this.fileRepository
      .createQueryBuilder()
      .delete()
      .from(FileEntity)
      .where('id = :id', { id });
    if (userRoleId !== RoleEnum.admin)
      queryBuilder = queryBuilder.andWhere('owner = :userId', { userId });
    const deletionResult = await queryBuilder
      .returning(['owner', 'name'])
      .execute();
    if (!deletionResult.affected) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            file: 'fileUnavailable',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const deletedRow = deletionResult.raw[0];
    console.log({ deletedRow });
    return fs.unlink(`files/${deletedRow.ownerId}/${deletedRow.name}`);
  }

  async deleteAllFiles(): Promise<number> {
    const deletionResult = await this.fileRepository
      .createQueryBuilder()
      .delete()
      .from(FileEntity)
      .returning(['owner', 'name'])
      .execute();
    try {
      await fs.rm('files', { recursive: true });
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            errors: {
              file: 'unableToDeleteFiles',
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return deletionResult.affected;
  }
}
