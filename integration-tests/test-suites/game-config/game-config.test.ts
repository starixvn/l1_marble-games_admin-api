import { addAdminAuth } from '../../utils/auth';
import { Role } from '../../../src/common/enums/role.enum';

describe("Game Config", () => {
  const baseUrl = global.__API_SERVICE__.getBaseUrl();

  describe("upsert", () => {
    describe("unauthenticated", () => {
      it("should throw 401", async () => {
        // Arrange
        const gameId = 123;
        const schemaId = '507f1f77bcf86cd799439001';
        const config = { level: 5 };

        // Act
        const response = await fetch(`${baseUrl}/gameConfig/upsert?gameId=${gameId}&schemaId=${schemaId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        // Assert
        expect(response.status).toBe(401);
      });
    });

    describe("developer account", () => {
      it("should return 403", async () => {
        // Arrange
        const credentials = global.__ADMIN_CREDENTIALS__;
        const createAccountData = {
          username: `dev_${Date.now()}`,
          role: Role.DEVELOPER
        };

        const createResponse = await fetch(`${baseUrl}/auth/createAccount`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${credentials?.access_token}`
          },
          body: JSON.stringify(createAccountData),
        });
        const devAccount = await createResponse.json();

        const loginResponse = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: devAccount.username,
            password: devAccount.password
          }),
        });
        const loginData = await loginResponse.json();

        // Act
        const response = await fetch(`${baseUrl}/gameConfig/upsert?gameId=123&schemaId=507f1f77bcf86cd799439001`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.access_token}`
          },
          body: JSON.stringify({ level: 5 }),
        });
        
        // Assert
        expect(response.status).toBe(403);
      });
    });

    describe("valid config object", () => {
      it("should upsert game config and return updated game config", async () => {
        // Arrange
        const gameId = 456;
        const schema = {
          schema: {
            type: 'object',
            properties: {
              level: { type: 'number', minimum: 1, maximum: 100 },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
            },
            required: ['level', 'difficulty']
          },
          name: 'Game Config Schema',
          uiSchema: {}
        };

        const schemaResponse = await fetch(`${baseUrl}/gameConfigSchema/upsert`, {
          method: 'POST',
          headers: {
            ...addAdminAuth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(schema),
        });

        expect(schemaResponse.status).toBe(200);
        const schemaData = await schemaResponse.json();
        const schemaId = schemaData.id;

        const config = {
          level: 5,
          difficulty: 'medium'
        };

        // Act
        const response = await fetch(`${baseUrl}/gameConfig/upsert?gameId=${gameId}&schemaId=${schemaId}`, {
          method: 'POST',
          headers: {
            ...addAdminAuth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        // Assert
        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data).toEqual(
          expect.objectContaining({
            gameId: gameId,
            config: config
          })
        );
      });
    });

    describe("invalid config object", () => {
      it("should throw 400", async () => {
        // Arrange
        const gameId = 789;
        const schema = {
          schema: {
            type: 'object',
            properties: {
              level: { type: 'number', minimum: 1, maximum: 100 },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
            },
            required: ['level', 'difficulty']
          },
          name: 'Game Config Schema',
          uiSchema: {}
        };

        const schemaResponse = await fetch(`${baseUrl}/gameConfigSchema/upsert`, {
          method: 'POST',
          headers: {
            ...addAdminAuth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(schema),
        });

        expect(schemaResponse.status).toBe(200);
        const schemaData = await schemaResponse.json();
        const schemaId = schemaData.id;

        const invalidConfig = {
          level: 150,
          difficulty: 'medium'
        };

        // Act
        const response = await fetch(`${baseUrl}/gameConfig/upsert?gameId=${gameId}&schemaId=${schemaId}`, {
          method: 'POST',
          headers: {
            ...addAdminAuth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidConfig),
        });

        // Assert
        expect(response.status).toBe(400);
      });

      it("should return validation errors in response", async () => {
        // Arrange
        const gameId = 790;
        const schema = {
          schema: {
            type: 'object',
            properties: {
              level: { type: 'number', minimum: 1, maximum: 100 },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
            },
            required: ['level', 'difficulty']
          },
          name: 'Game Config Schema',
          uiSchema: {}
        };

        const schemaResponse = await fetch(`${baseUrl}/gameConfigSchema/upsert`, {
          method: 'POST',
          headers: {
            ...addAdminAuth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(schema),
        });

        expect(schemaResponse.status).toBe(200);
        const schemaData = await schemaResponse.json();
        const schemaId = schemaData._id;

        const invalidConfig = {
          level: 150,
          difficulty: 'medium'
        };

        // Act
        const response = await fetch(`${baseUrl}/gameConfig/upsert?gameId=${gameId}&schemaId=${schemaId}`, {
          method: 'POST',
          headers: {
            ...addAdminAuth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidConfig),
        });

        // Assert
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual(
          expect.objectContaining({
            error: "Bad Request",
            message: expect.arrayContaining([
              expect.stringContaining("schemaId must be a mongodb id")
            ]),
            statusCode: 400
          })
        );
      });
    });

    describe("no schema id provided", () => {
      describe("invalid config object", () => {
        it("should throw 400 with error message", async () => {
          // Arrange
          const gameId = 791;
          const invalidConfig = {
            level: 150
          };

          // Act
          const response = await fetch(`${baseUrl}/gameConfig/upsert?gameId=${gameId}`, {
            method: 'POST',
            headers: {
              ...addAdminAuth(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(invalidConfig),
          });

          // Assert
          expect(response.status).toBe(400);
          const data = await response.json();
          expect(data).toEqual(
            expect.objectContaining({
              validationErrors: expect.arrayContaining([
                expect.objectContaining({
                  instancePath: "",
                  keyword: "required",
                  message: "must have required property 'enabled'"
                })
              ])
            })
          );
        });

      });

      describe("valid config object", () => {
        it("should upsert game config and return updated game config", async () => {
          // Arrange
          const gameId = 792;
          const validConfig = {
            enabled: true
          };

          // Act
          const response = await fetch(`${baseUrl}/gameConfig/upsert?gameId=${gameId}`, {
            method: 'POST',
            headers: {
              ...addAdminAuth(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(validConfig),
          });

          // Assert
          expect(response.status).toBe(200);
          
          const data = await response.json();
          expect(data).toEqual(
            expect.objectContaining({
              gameId: gameId,
              config: validConfig
            })
          );
        });
      });

    });
  });

  describe("get", () => {
    describe("unauthenticated", () => {
      it("should throw 401", async () => {
        // Arrange
        const gameId = 999;

        // Act
        const response = await fetch(`${baseUrl}/gameConfig/get?gameId=${gameId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Assert
        expect(response.status).toBe(401);
      });
    });

    describe("Not found", () => {
      it("should throw 404", async () => {
        // Arrange
        const nonExistentGameId = 999999;

        // Act
        const response = await fetch(`${baseUrl}/gameConfig/get?gameId=${nonExistentGameId}`, {
          method: 'GET',
          headers: addAdminAuth(),
        });

        // Assert
        expect(response.status).toBe(404);
        
        const data = await response.json();
        expect(data).toEqual(
          expect.objectContaining({
            statusCode: 404,
            message: expect.stringContaining('Game config not found')
          })
        );
      });
    });

    describe("valid game id", () => {
      it("should return game config", async () => {
        // Arrange
        const gameId = 456;
        const schema = {
          schema: {
            type: 'object',
            properties: {
              level: { type: 'number', minimum: 1, maximum: 100 },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
            },
            required: ['level', 'difficulty']
          },
          name: 'Game Config Schema',
          uiSchema: {}
        };

        const schemaResponse = await fetch(`${baseUrl}/gameConfigSchema/upsert`, {
          method: 'POST',
          headers: {
            ...addAdminAuth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(schema),
        });

        expect(schemaResponse.status).toBe(200);
        const schemaData = await schemaResponse.json();
        const schemaId = schemaData.id;

        const config = {
          level: 25,
          difficulty: 'hard'
        };

        const createResponse = await fetch(`${baseUrl}/gameConfig/upsert?gameId=${gameId}&schemaId=${schemaId}`, {
          method: 'POST',
          headers: {
            ...addAdminAuth(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        expect(createResponse.status).toBe(200);

        // Act
        const response = await fetch(`${baseUrl}/gameConfig/get?gameId=${gameId}`, {
          method: 'GET',
          headers: addAdminAuth(),
        });

        // Assert
        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data).toEqual(
          expect.objectContaining({
            gameId: gameId,
            config: config
          })
        );
      });
    });
  });

  describe("list", () => {
    describe("unauthenticated", () => {
      it("should throw 401", async () => {
        // Act
        const response = await fetch(`${baseUrl}/gameConfig/list`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Assert
        expect(response.status).toBe(401);
      });
    });
    
    it("should return all game configs", async () => {
      // Act
      const response = await fetch(`${baseUrl}/gameConfig/list`, {
        method: 'GET',
        headers: addAdminAuth(),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      data.forEach(gameConfig => {
        expect(gameConfig).toEqual(
          expect.objectContaining({
            gameId: expect.any(Number),
            config: expect.any(Object)
          })
        );
      });
    });
  });
});
