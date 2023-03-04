import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RoleEnum } from '../role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.user.role.id === RoleEnum.admin;
  }
}
