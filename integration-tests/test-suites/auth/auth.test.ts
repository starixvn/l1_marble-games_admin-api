import { setAdminCredentials } from '../../utils/auth';
import { Role } from '../../../src/auth/schema/account.schema';

describe("Auth", () => {
  const baseUrl = global.__API_SERVICE__.getBaseUrl();

  describe("OneTimeRegister", () => {
    it("should return 400 when admin account already exists", async () => {
      // Act
      const response = await fetch(`${baseUrl}/api/auth/oneTimeRegister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Assert
      expect(response.status).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toEqual(
        expect.objectContaining({
          message: "Only one admin account is allowed"
        })
      );
    });
  });

  describe("Login", () => {
    it("should return token on login with correct account", async () => {
      // Arrange
      const credentials = global.__ADMIN_CREDENTIALS__;
      expect(credentials).toBeTruthy();
      
      if (!credentials) {
        throw new Error("Admin credentials not found");
      }

      // Act
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          access_token: expect.any(String)
        })
      );
      expect(data.access_token.length).toBeGreaterThan(0);

      setAdminCredentials({
        username: credentials.username,
        password: credentials.password,
        access_token: data.access_token
      });
    });

    it("should return 401 on login with incorrect account", async () => {
      // Arrange
      const invalidLoginData = {
        username: "nonexistent",
        password: "wrongpassword"
      };

      // Act
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidLoginData),
      });

      // Assert
      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toEqual(
        expect.objectContaining({
          message: "Invalid credentials"
        })
      );
    });

    it("should return 401 on login with correct username but wrong password", async () => {
      // Act
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: "admin",
          password: "wrong-password"
        }),
      });

      // Assert
      expect(response.status).toBe(401);
      
      const errorData = await response.json();
      expect(errorData).toEqual(
        expect.objectContaining({
          message: "Invalid credentials"
        })
      );
    });
  });

  describe("ChangePassword", () => {
    it("should return account on change password", async () => {
      // Arrange
      const credentials = global.__ADMIN_CREDENTIALS__;
      expect(credentials).toBeTruthy();
      expect(credentials?.access_token).toBeTruthy();
      
      if (!credentials?.access_token) {
        throw new Error("Admin credentials or access token not found");
      }

      // Act
      const response = await fetch(`${baseUrl}/api/auth/changePassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.access_token}`
        },
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          username: "admin",
          password: expect.any(String)
        })
      );
      expect(data.password.length).toBeGreaterThan(0);

      setAdminCredentials({
        username: data.username,
        password: data.password,
        access_token: credentials.access_token
      });
    });

    it("should return 401 when no authorization token provided", async () => {
      // Act
      const response = await fetch(`${baseUrl}/api/auth/changePassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Assert
      expect(response.status).toBe(401);
    });

    it("should return 401 when invalid authorization token provided", async () => {
      // Act
      const response = await fetch(`${baseUrl}/api/auth/changePassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
      });

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe("CreateAccount", () => {
    it("should return 401 when no authorization token provided", async () => {
      // Arrange
      const createAccountData = {
        username: "testuser",
        password: "testpass",
        role: Role.DEVELOPER
      };

      // Act
      const response = await fetch(`${baseUrl}/api/auth/createAccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createAccountData),
      });

      // Assert
      expect(response.status).toBe(401);
    });

    it("should return 409 when account already exists", async () => {
      // Arrange
      const credentials = global.__ADMIN_CREDENTIALS__;
      expect(credentials).toBeTruthy();
      expect(credentials?.access_token).toBeTruthy();
      
      if (!credentials?.access_token) {
        throw new Error("Admin credentials or access token not found");
      }

      const createAccountData = {
        username: "admin",
        role: Role.DEVELOPER
      };

      // Act
      const response = await fetch(`${baseUrl}/api/auth/createAccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.access_token}`
        },
        body: JSON.stringify(createAccountData),
      });
      const errorData = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(errorData).toEqual(
        expect.objectContaining({
          message: "Account already exists"
        })
      );
    });

    it("should return 200 when account is created", async () => {
      // Arrange
      const credentials = global.__ADMIN_CREDENTIALS__;
      expect(credentials).toBeTruthy();
      expect(credentials?.access_token).toBeTruthy();
      
      if (!credentials?.access_token) {
        throw new Error("Admin credentials or access token not found");
      }

      const createAccountData = {
        username: `newuser_${Date.now()}`,
        role: Role.DEVELOPER
      };

      // Act
      const response = await fetch(`${baseUrl}/api/auth/createAccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${credentials.access_token}`
        },
        body: JSON.stringify(createAccountData),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(
        expect.objectContaining({
          username: createAccountData.username,
          password: expect.any(String)
        })
      );
    });
  });
});
