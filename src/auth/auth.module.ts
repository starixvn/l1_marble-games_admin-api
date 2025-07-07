import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { AuthController } from "./auth.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { OperatorModule } from "../operator/operator.module";
import { ConfigKeys } from "../config/config-keys";
import { MongooseModule } from "@nestjs/mongoose";
import { Account, AccountSchema } from "./schema/account.schema";
import { DiscoveryModule } from "@nestjs/core";

@Module({
  imports: [
    ConfigModule,
    OperatorModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema, collection: "accounts" },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get(ConfigKeys.Jwt).secret,
      }),
    }),
    DiscoveryModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
