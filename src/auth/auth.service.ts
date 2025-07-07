import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { compare, hash } from "bcryptjs";
import { ConfigKeys } from "../config/config-keys";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Account, AccountDocument } from "./schema/account.schema";
import { generateRandomPassword } from "../utils/random";
import { Role } from "../common/enums/role.enum";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../common/decorators/role.decorator";
import { IS_PUBLIC_KEY } from "../common/decorators/public.decorator";

const SALT_ROUND = 10;

interface AccountCredentialParams {
  username: string;
  password?: string;
}

interface JwtPayload {
  id: string;
  role: Role;
}

export interface CreateAccountParams {
  username: string;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly expireIn: string;

  constructor(
    @Inject(ConfigService) configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @Inject(DiscoveryService)
    private readonly discoveryService: DiscoveryService,
    @Inject(MetadataScanner)
    private readonly metadataScanner: MetadataScanner,
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {
    this.expireIn = configService.get(ConfigKeys.Jwt).signOptions.expireIn;
  }

  async validateAccount({
    username,
    password,
  }: AccountCredentialParams): Promise<{ id: string; role: Role } | null> {
    if (!password) {
      return null;
    }

    const account = await this.getAccount(username);

    if (!account) {
      return null;
    }

    const isPasswordMatch = await compare(password, account.password);

    return isPasswordMatch
      ? {
          id: (account._id as unknown as string).toString(),
          role: account.role,
        }
      : null;
  }

  async generateJwt(user: JwtPayload): Promise<string> {
    const payload = { id: user?.id, role: user?.role };

    const token = await this.jwtService.signAsync(payload, {
      subject: user.id,
      expiresIn: this.expireIn,
    });

    return token;
  }

  async oneTimeRegister() {
    const username = "admin";

    const existingAccount = await this.getAccount(username);

    if (existingAccount) {
      throw new BadRequestException("Only one admin account is allowed");
    }

    const password = generateRandomPassword();

    const hashedPassword = await hash(password, SALT_ROUND);

    const newAccount = new this.accountModel({
      username: username,
      password: hashedPassword,
      role: Role.ADMIN,
    });

    await newAccount.save();

    return {
      username,
      password,
    };
  }

  async changePassword(userId: string) {
    const existingAccount = await this.getAccountById(userId);

    if (!existingAccount) {
      throw new UnauthorizedException("Account not found");
    }

    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    existingAccount.password = hashedPassword;

    await existingAccount.save();

    return {
      username: existingAccount.username,
      password,
    };
  }

  async createAccount(args: CreateAccountParams) {
    const existingAccount = await this.getAccount(args.username);

    if (existingAccount) {
      throw new ConflictException("Account already exists");
    }

    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    const newAccount = new this.accountModel({
      username: args.username,
      password: hashedPassword,
      role: args.role,
    });

    await newAccount.save();

    return {
      username: args.username,
      password,
    };
  }

  async getAllAccounts() {
    const accounts = await this.accountModel.find();
    return accounts.map((account) => ({
      username: account.username,
      role: account.role,
    }));
  }

  async getProfile(userId: string) {
    const account = await this.getAccountById(userId);

    if (!account) {
      throw new UnauthorizedException("Account not found");
    }

    const allowedEndpoints = await this.getAllowedEndpoints(userId);

    return {
      username: account.username,
      role: account.role,
      allowedEndpoints,
    };
  }

  private async getAllowedEndpoints(userId: string): Promise<string[]> {
    const account = await this.getAccountById(userId);

    if (!account) {
      throw new UnauthorizedException("Account not found");
    }

    return this.getAllAllowedEndpoints(account.role);
  }

  private async getAccount(username: string): Promise<AccountDocument | null> {
    return this.accountModel.findOne({ username });
  }

  private async getAccountById(
    userId: string,
  ): Promise<AccountDocument | null> {
    return this.accountModel.findById(userId);
  }

  private getAllAllowedEndpoints(role: Role): string[] {
    const controllers = this.discoveryService.getControllers();
    const endpoints: string[] = [];

    controllers.forEach((controller) => {
      const { instance, metatype } = controller;
      if (!instance || !metatype) return;

      const controllerPath = Reflect.getMetadata("path", metatype) ?? "";
      const prototype = Object.getPrototypeOf(instance) as object | null;
      if (!prototype) return;
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);
      methodNames.forEach((methodKey: string) => {
        const methodPath = Reflect.getMetadata(
          "path",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          instance[methodKey],
        ) as unknown as string;

        const methodRoles =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            instance[methodKey],
            metatype,
          ]) ?? [];

        const isPublic =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            instance[methodKey],
            metatype,
          ]) ?? false;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const fullPath = this.buildFullPath(controllerPath, methodPath);

        if (isPublic || methodRoles.includes(role)) {
          endpoints.push(fullPath);
        }
      });
    });

    return endpoints;
  }

  private buildFullPath(controllerPath: string, methodPath: string): string {
    if (!controllerPath && !methodPath) return "/";
    if (!controllerPath) return `/${methodPath}`;
    if (!methodPath) return `/${controllerPath}`;
    return `/${controllerPath}/${methodPath}`.replace(/\/+/g, "/");
  }
}
