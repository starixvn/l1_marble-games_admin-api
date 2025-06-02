import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: unknown, user: any, info: any) {
    if (err || !user) {
      if (info instanceof Error && info.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Expired Token');
      }
      throw err ?? new UnauthorizedException();
    }
    return user;
  }
}
