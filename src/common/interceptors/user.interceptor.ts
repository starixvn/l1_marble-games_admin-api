import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { Observable } from "rxjs";
import { Role } from "../enums/role.enum";

@Injectable()
export class UserInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string; role: Role; username: string };

    this.cls.set("user", user);

    return next.handle();
  }
}
