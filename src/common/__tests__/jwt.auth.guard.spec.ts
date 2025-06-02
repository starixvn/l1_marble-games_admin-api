import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should call canActivate and return expected result', async () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnThis(),
    } as unknown as ExecutionContext;

    jest.spyOn(guard, 'canActivate').mockResolvedValue(true);

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  describe('handleRequest', () => {
    it('should return user when authentication succeeds', () => {
      const user = { id: 1, username: 'test' };
      const result = guard.handleRequest(null, user, null);
      expect(result).toBe(user);
    });

    it('should throw UnauthorizedException with "Expired Token" message when token is expired', () => {
      const tokenExpiredError = new Error('jwt expired');
      tokenExpiredError.name = 'TokenExpiredError';
      
      expect(() => {
        guard.handleRequest(null, null, tokenExpiredError);
      }).toThrow(new UnauthorizedException('Expired Token'));
    });

    it('should throw UnauthorizedException when authentication fails without specific error', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw the original error when authentication fails with non-expiration error', () => {
      const error = new Error('Authentication failed');
      expect(() => {
        guard.handleRequest(error, null, null);
      }).toThrow(error);
    });
  });
});
