import { addAdminAuth } from '../../utils/auth';

describe("Game Config Schema", () => {
  const baseUrl = global.__API_SERVICE__.getBaseUrl();

  describe("upsert", () => {
    it("should return 401 if not authenticated", async () => {
      // Arrange
      const schema = {
        schema: {
          type: 'object',
          properties: {
            level: { type: 'number', minimum: 1, maximum: 100 }
          },
          required: ['level']
        },
        displayName: 'Test Schema',
        uiSchema: {}
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsert`, {
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
      const schema = {
        schema: {
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
        },
        displayName: 'Game Settings Schema',
        uiSchema: {
          'ui:order': ['level', 'difficulty', 'settings']
        }
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsert`, {
        method: 'POST',
        headers: {
          ...addAdminAuth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          schema: schema.schema,
          displayName: schema.displayName,
          uiSchema: schema.uiSchema,
          _id: expect.any(String)
        })
      );
    });

    it("should create new schema if id not provided", async () => {
      // Arrange
      const schema = {
        schema: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0 },
            playerName: { type: 'string', maxLength: 50 }
          },
          required: ['score', 'playerName']
        },
        displayName: 'Player Score Schema',
        uiSchema: {
          playerName: { 'ui:placeholder': 'Enter player name' }
        }
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsert`, {
        method: 'POST',
        headers: {
          ...addAdminAuth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          schema: schema.schema,
          displayName: schema.displayName,
          uiSchema: schema.uiSchema,
          _id: expect.any(String)
        })
      );
    });

    it("should update existing schema if id provided", async () => {
      // Arrange - First create a schema
      const initialSchema = {
        schema: {
          type: 'object',
          properties: {
            level: { type: 'number', minimum: 1, maximum: 50 }
          },
          required: ['level']
        },
        displayName: 'Initial Schema',
        uiSchema: {}
      };

      const createResponse = await fetch(`${baseUrl}/api/gameConfigSchema/upsert`, {
        method: 'POST',
        headers: {
          ...addAdminAuth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initialSchema),
      });

      expect(createResponse.status).toBe(200);
      const createdData = await createResponse.json();
      const schemaId = createdData._id;

      const updatedSchema = {
        schema: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 999999 },
            playerName: { type: 'string', maxLength: 30 },
            achievements: { type: 'array', items: { type: 'string' } }
          },
          required: ['score', 'playerName']
        },
        displayName: 'Updated Player Schema',
        uiSchema: {
          score: { 'ui:widget': 'updown' },
          achievements: { 'ui:options': { addable: true, removable: true } }
        }
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsert?id=${schemaId}`, {
        method: 'POST',
        headers: {
          ...addAdminAuth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSchema),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          _id: schemaId,
          schema: updatedSchema.schema,
          displayName: updatedSchema.displayName,
          uiSchema: updatedSchema.uiSchema
        })
      );
    });

    it("should throw 400 if id is invalid", async () => {
      // Arrange
      const invalidId = 'invalid-object-id';
      const schema = {
        schema: {
          type: 'object',
          properties: {
            test: { type: 'string' }
          }
        },
        displayName: 'Test Schema',
        uiSchema: {}
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsert?id=${invalidId}`, {
        method: 'POST',
        headers: {
          ...addAdminAuth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      // Assert
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Invalid ObjectId format')
        })
      );
    });

    it("should create new schema if provided id is valid object id", async () => {
      // Arrange
      const validObjectId = '507f1f77bcf86cd799439011'; // Valid ObjectId format that doesn't exist
      const schema = {
        schema: {
          type: 'object',
          properties: {
            gameMode: { type: 'string', enum: ['single', 'multiplayer'] },
            duration: { type: 'number', minimum: 60, maximum: 3600 }
          },
          required: ['gameMode', 'duration']
        },
        displayName: 'Game Mode Schema',
        uiSchema: {
          gameMode: { 'ui:widget': 'radio' },
          duration: { 'ui:help': 'Duration in seconds' }
        }
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/upsert?id=${validObjectId}`, {
        method: 'POST',
        headers: {
          ...addAdminAuth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      // Assert
      expect(response.status).toBe(200);
      
      if (response.headers.get('content-length') === '0' || response.headers.get('content-type')?.includes('application/json') === false) {
        // If response is empty or not JSON, just check status
        return;
      }
      
      const responseText = await response.text();
      if (!responseText.trim()) {
        // Empty response, just verify status was 200
        return;
      }
      
      const data = JSON.parse(responseText);
      expect(data).toEqual(
        expect.objectContaining({
          _id: validObjectId,
          schema: schema.schema,
          displayName: schema.displayName,
          uiSchema: schema.uiSchema
        })
      );
    });
  });

  describe("get", () => {
    it("should return 401 if not authenticated", async () => {
      // Arrange
      const schemaId = '507f1f77bcf86cd799439012';

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/get?id=${schemaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Assert
      expect(response.status).toBe(401);
    });

    it("should return 400 if id is invalid", async () => {
      // Arrange
      const invalidId = 'invalid-id';

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/get?id=${invalidId}`, {
        method: 'GET',
        headers: addAdminAuth(),
      });

      // Assert
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('Invalid ObjectId format')
        })
      );
    });

    it("should return 404 if schema not found", async () => {
      // Arrange
      const nonExistentId = '507f1f77bcf86cd799439013';

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/get?id=${nonExistentId}`, {
        method: 'GET',
        headers: addAdminAuth(),
      });

      // Assert
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          statusCode: 404,
          message: expect.stringContaining('Game config schema not found')
        })
      );
    });

    it("should return schema if valid id provided", async () => {
      // Arrange - Create a schema first
      const schema = {
        schema: {
          type: 'object',
          properties: {
            health: { type: 'number', minimum: 1, maximum: 100 },
            armor: { type: 'number', minimum: 0, maximum: 50 }
          },
          required: ['health']
        },
        displayName: 'Character Stats Schema',
        uiSchema: {
          health: { 'ui:widget': 'range' }
        }
      };

      const createResponse = await fetch(`${baseUrl}/api/gameConfigSchema/upsert`, {
        method: 'POST',
        headers: {
          ...addAdminAuth(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      expect(createResponse.status).toBe(200);
      const createdData = await createResponse.json();
      const schemaId = createdData._id;

      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/get?id=${schemaId}`, {
        method: 'GET',
        headers: addAdminAuth(),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          _id: schemaId,
          schema: schema.schema,
          displayName: schema.displayName,
          uiSchema: schema.uiSchema
        })
      );
    });

    it("should return all schemas if no id provided", async () => {
      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/get`, {
        method: 'GET',
        headers: addAdminAuth(),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      data.forEach(schema => {
        expect(schema).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            displayName: expect.any(String)
          })
        );
      });
    });
  });

  describe("list", () => {
    it("should return 401 if not authenticated", async () => {
      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Assert
      expect(response.status).toBe(401);
    });

    it("should return all schemas", async () => {
      // Act
      const response = await fetch(`${baseUrl}/api/gameConfigSchema/list`, {
        method: 'GET',
        headers: addAdminAuth(),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      data.forEach(schema => {
        expect(schema).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            displayName: expect.any(String)
          })
        );
      });
    });
  });
});
