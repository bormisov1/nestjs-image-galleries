import { HttpException, HttpStatus, Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from './entities/file.entity';
import { FileService } from './file.service';
import { User } from '../user/entities/user.entity';
import * as fs from 'fs';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        fileFilter: (request, file, callback) => {
          if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return callback(
              new HttpException(
                {
                  status: HttpStatus.UNPROCESSABLE_ENTITY,
                  errors: {
                    file: `cantUploadFileType`,
                  },
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
              ),
              false,
            );
          }

          callback(null, true);
        },
        storage: diskStorage({
          destination: (req, file, cb) => {
            const destination = `./files/${(req.user as User).id}/`;
            if (!fs.existsSync(destination))
              fs.mkdirSync(destination, { recursive: true });
            cb(null, destination);
          },
          filename: (request, file, callback) => {
            callback(
              null,
              `${randomStringGenerator()}.${file.originalname
                .split('.')
                .pop()
                .toLowerCase()}`,
            );
          },
        }),
        limits: {
          fileSize: configService.get('file.maxFileSize'),
        },
      }),
    }),
  ],
  controllers: [FileController],
  providers: [ConfigModule, ConfigService, FileService],
})
export class FileModule {}
