import { addAdminAuth } from '../../utils/auth';

describe("Game Config Schema", () => {
  const baseUrl = global.__API_SERVICE__.getBaseUrl();

  describe("Upsert Schema", () => {
    it("should return 401 if not authenticated", async () => {
      // Arrange
      const gameId = 123;
      const schema = {
        type: 'object',
        properties: {
          level: { type: 'number', minimum: 1, maximum: 100 }
        },
        required: ['level']
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsertSchema?gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      // Assert
      expect(response.status).toBe(401);
    });

    it("should upsert game config schema and return updated schema", async () => {
      // Arrange
      const gameId = 456;
      const schema = {
        type: 'object',
        properties: {
          level: { type: 'number', minimum: 1, maximum: 100 },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          settings: {
            type: 'object',
            properties: {
              sound: { type: 'boolean' },
              music: { type: 'boolean' }
            },
            required: ['sound', 'music']
          }
        },
        required: ['level', 'difficulty', 'settings']
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsertSchema?gameId=${gameId}`, {
        method: 'POST',
        headers: addAdminAuth(),
        body: JSON.stringify(schema),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          gameId: gameId,
          schema: schema
        })
      );
    });

    it("should create new schema for new gameId", async () => {
      // Arrange
      const gameId = 789;
      const schema = {
        type: 'object',
        properties: {
          score: { type: 'number', minimum: 0 },
          playerName: { type: 'string', maxLength: 50 }
        },
        required: ['score', 'playerName']
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsertSchema?gameId=${gameId}`, {
        method: 'POST',
        headers: addAdminAuth(),
        body: JSON.stringify(schema),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          gameId: gameId,
          schema: schema
        })
      );
    });

    it("should update existing schema for existing gameId", async () => {
      // Arrange
      const gameId = 789; // Using same gameId as previous test to test update
      const updatedSchema = {
        type: 'object',
        properties: {
          score: { type: 'number', minimum: 0, maximum: 999999 },
          playerName: { type: 'string', maxLength: 30 },
          achievements: { type: 'array', items: { type: 'string' } }
        },
        required: ['score', 'playerName']
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsertSchema?gameId=${gameId}`, {
        method: 'POST',
        headers: addAdminAuth(),
        body: JSON.stringify(updatedSchema),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          gameId: gameId,
          schema: updatedSchema
        })
      );
    });

    it("should handle complex nested schema structures", async () => {
      // Arrange
      const gameId = 999;
      const complexSchema = {
        type: 'object',
        properties: {
          gameSettings: {
            type: 'object',
            properties: {
              graphics: {
                type: 'object',
                properties: {
                  resolution: { type: 'string', enum: ['720p', '1080p', '4K'] },
                  quality: { type: 'string', enum: ['low', 'medium', 'high', 'ultra'] }
                },
                required: ['resolution', 'quality']
              },
              audio: {
                type: 'object',
                properties: {
                  masterVolume: { type: 'number', minimum: 0, maximum: 100 },
                  musicVolume: { type: 'number', minimum: 0, maximum: 100 },
                  effectsVolume: { type: 'number', minimum: 0, maximum: 100 }
                },
                required: ['masterVolume']
              }
            },
            required: ['graphics', 'audio']
          },
          playerProgress: {
            type: 'object',
            properties: {
              currentLevel: { type: 'number', minimum: 1 },
              unlockedItems: { type: 'array', items: { type: 'string' } },
              achievements: { type: 'array', items: { type: 'string' } }
            },
            required: ['currentLevel']
          }
        },
        required: ['gameSettings', 'playerProgress']
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsertSchema?gameId=${gameId}`, {
        method: 'POST',
        headers: addAdminAuth(),
        body: JSON.stringify(complexSchema),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          gameId: gameId,
          schema: complexSchema
        })
      );
    });

    it("should handle empty schema object", async () => {
      // Arrange
      const gameId = 111;
      const emptySchema = {};

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsertSchema?gameId=${gameId}`, {
        method: 'POST',
        headers: addAdminAuth(),
        body: JSON.stringify(emptySchema),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          gameId: gameId
        })
      );
    });
  });
});
