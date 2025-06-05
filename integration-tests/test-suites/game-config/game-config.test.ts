import { addAdminAuth } from '../../utils/auth';

describe("Game Config", () => {
  const baseUrl = global.__API_SERVICE__.getBaseUrl();

  describe("upsertGameConfig", () => {
    describe("unauthenticated", () => {
      it("should throw 401", async () => {
        // Arrange
        const gameId = 123;
        const config = { level: 5 };

        // Act
        const response = await fetch(`${baseUrl}/api/gameConfig/upsertGameConfig?gameId=${gameId}`, {
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

    describe("valid config object", () => {
      it("should upsert game config and return updated game config", async () => {
        // Arrange
        const gameId = 456;
        const schema = {
          type: 'object',
          properties: {
            level: { type: 'number', minimum: 1, maximum: 100 },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
          },
          required: ['level', 'difficulty']
        };

        await fetch(`${baseUrl}/api/gameConfigSchema/upsertSchema?gameId=${gameId}`, {
          method: 'POST',
          headers: addAdminAuth(),
          body: JSON.stringify(schema),
        });

        const config = {
          level: 5,
          difficulty: 'medium'
        };

        // Act
        const response = await fetch(`${baseUrl}/api/gameConfig/upsertGameConfig?gameId=${gameId}`, {
          method: 'POST',
          headers: addAdminAuth(),
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
          type: 'object',
          properties: {
            level: { type: 'number', minimum: 1, maximum: 100 },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
          },
          required: ['level', 'difficulty']
        };

        await fetch(`${baseUrl}/api/gameConfigSchema/upsertSchema?gameId=${gameId}`, {
          method: 'POST',
          headers: addAdminAuth(),
          body: JSON.stringify(schema),
        });

        const invalidConfig = {
          level: 150,
          difficulty: 'medium'
        };

        // Act
        const response = await fetch(`${baseUrl}/api/gameConfig/upsertGameConfig?gameId=${gameId}`, {
          method: 'POST',
          headers: addAdminAuth(),
          body: JSON.stringify(invalidConfig),
        });

        // Assert
        expect(response.status).toBe(400);
      });

      it("should return validation errors in response", async () => {
        // Arrange
        const gameId = 790;
        const schema = {
          type: 'object',
          properties: {
            level: { type: 'number', minimum: 1, maximum: 100 },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
          },
          required: ['level', 'difficulty']
        };

        await fetch(`${baseUrl}/api/gameConfigSchema/upsertSchema?gameId=${gameId}`, {
          method: 'POST',
          headers: addAdminAuth(),
          body: JSON.stringify(schema),
        });

        const invalidConfig = {
          level: 150,
          difficulty: 'medium'
        };

        // Act
        const response = await fetch(`${baseUrl}/api/gameConfig/upsertGameConfig?gameId=${gameId}`, {
          method: 'POST',
          headers: addAdminAuth(),
          body: JSON.stringify(invalidConfig),
        });

        // Assert
        const data = await response.json();
        expect(data).toEqual(
          expect.objectContaining({
            statusCode: 400,
            error: "Bad Request",
            message: expect.arrayContaining([
              expect.objectContaining({
                instancePath: "/level",
                keyword: "maximum",
                message: "must be <= 100"
              })
            ])
          })
        );
      });
    });

    describe("no schema found", () => {
      it("should throw 404", async () => {
        // Arrange
        const gameId = 999;
        const config = {
          level: 5,
          difficulty: 'medium'
        };

        // Act
        const response = await fetch(`${baseUrl}/api/gameConfig/upsertGameConfig?gameId=${gameId}`, {
          method: 'POST',
          headers: addAdminAuth(),
          body: JSON.stringify(config),
        });
        console.log(await response.json());
        // Assert
        expect(response.status).toBe(404);
      });
    });
  });
});
