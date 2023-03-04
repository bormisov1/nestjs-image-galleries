import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileService } from './file.service';
import { AdminGuard } from '../role/guards/admin.guard';
import { memoryStorage } from 'multer';

@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FileController {
  constructor(private readonly filesService: FileService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadFile(file, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiParam({ name: 'id', description: 'File ID' })
  async download(
    @Req() req,
    @Param('id', new ParseUUIDPipe()) id,
    @Response() response,
  ) {
    const fileRow = await this.filesService.getFileRowById(
      id,
      req.user.id,
      req.user.role.id,
    );
    return response.sendFile(fileRow.name, {
      root: `files/${req.user.id}`,
      headers: {
        'Content-Disposition': `attachment; filename="${fileRow.originalName}"`,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async updateFile(
    @Req() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.filesService.updateFile(
      id,
      file,
      req.user.id,
      req.user.role.id,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiParam({ name: 'id', description: 'File ID' })
  async deleteById(
    @Req() req,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.filesService.deleteFileById(id, req.user.id, req.user.role.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete('')
  @ApiParam({ name: 'id', description: 'File ID' })
  async deleteAll(): Promise<void> {
    await this.filesService.deleteAllFiles();
  }
}
