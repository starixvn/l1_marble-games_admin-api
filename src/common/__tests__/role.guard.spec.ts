import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/role.guard';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/role.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
    mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn(),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access to public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return undefined;
      return undefined;
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access when user is not present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.ADMIN];
      return undefined;
    });

    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({});

    expect(guard.canActivate(mockContext)).toBe(false);
  });

  it('should allow access when user is not present but has no roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.ADMIN];
      return undefined;
    });

    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: {
        id: "123123"
      }
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.ADMIN];
      return undefined;
    });

    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: { role: Role.ADMIN },
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.ADMIN];
      return undefined;
    });

    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: { role: Role.DEVELOPER },
    });

    expect(guard.canActivate(mockContext)).toBe(false);
  });

  it('should allow access when user has one of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ROLES_KEY) return [Role.ADMIN, Role.DEVELOPER];
      return undefined;
    });

    (mockContext.switchToHttp().getRequest as jest.Mock).mockReturnValue({
      user: { role: Role.DEVELOPER },
    });

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
