import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/role/role.decorator';
import { RoleEnum } from 'src/role/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/role/guards/role.guard';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RoleGuard)
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProfileDto: CreateUserDto) {
    return this.usersService.create(createProfileDto);
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne({ id: +id });
  }
}
