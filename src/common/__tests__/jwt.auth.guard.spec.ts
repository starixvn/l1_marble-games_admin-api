import { JwtAuthGuard } from "../guards/jwt.auth.guard";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
    mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn(),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  });

  describe("canActivate", () => {
    it("should allow access to public routes", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return true;
        return undefined;
      });

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it("should proceed with normal authentication when route is not public", () => {
      jest.spyOn(reflector, "getAllAndOverride").mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        return undefined;
      });

      const canActivateSpy = jest
        .spyOn(guard, "canActivate")
        .mockResolvedValue(true);

      guard.canActivate(mockContext);
      expect(canActivateSpy).toHaveBeenCalledWith(mockContext);
    });
  });

  it("should call canActivate and return expected result", async () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnThis(),
    } as unknown as ExecutionContext;

    jest.spyOn(guard, "canActivate").mockResolvedValue(true);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  describe("handleRequest", () => {
    it("should return user when authentication succeeds", () => {
      const user = { id: 1, username: "test" };
      const result = guard.handleRequest(null, user, null);
      expect(result).toBe(user);
    });

    it('should throw UnauthorizedException with "Expired Token" message when token is expired', () => {
      const tokenExpiredError = new Error("jwt expired");
      tokenExpiredError.name = "TokenExpiredError";

      expect(() => {
        guard.handleRequest(null, null, tokenExpiredError);
      }).toThrow(new UnauthorizedException("Expired Token"));
    });

    it("should throw UnauthorizedException when authentication fails without specific error", () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });

    it("should throw the original error when authentication fails with non-expiration error", () => {
      const error = new Error("Authentication failed");
      expect(() => {
        guard.handleRequest(error, null, null);
      }).toThrow(error);
    });
  });
});
