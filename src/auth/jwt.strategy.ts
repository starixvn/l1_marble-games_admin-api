import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigKeys } from '../config/config-keys';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(ConfigService) configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get(ConfigKeys.Jwt).secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const userId = payload.sub ?? payload.id;
    
    return { 
      id: userId,
      role: payload.role
    };
  }
}
