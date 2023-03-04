import {
  AfterInsert,
  AfterLoad,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from '../../user/entities/user.entity';
import { Expose } from 'class-transformer';

@Entity({ name: 'file' })
export class FileEntity extends EntityHelper {
  @ApiProperty({ example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Allow()
  @ManyToOne(() => User, (user) => user.id)
  owner: number;

  @Allow()
  @Column()
  originalName: string;

  @Expose({ groups: ['admin'] })
  @Allow()
  @Column()
  name: string;
}
