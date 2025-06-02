import { MongoClient, ObjectId } from 'mongodb';

describe("Game Integration", () => {
  const baseUrl = global.__API_SERVICE__.getBaseUrl();
  
  describe("Upsert", () => {
    it("should throw 404 if operator not found (using alias)", async () => {
      // Arrange
      const nonExistentAlias = "non-existent-operator-alias";
      const gameId = 2001;
      const updateRequest = {
        mergeEvent: { eventType: "match", priority: 1 }
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?alias=${nonExistentAlias}&gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(404);
      
      const errorData = await response.json();
      expect(errorData.message).toBe('Operator not found');
    });

    it("should throw 404 if operator not found (using operatorId)", async () => {
      // Arrange
      const nonExistentOperatorId = "000000000000000000000000";
      const gameId = 2001;
      const updateRequest = {
        mergeEvent: { eventType: "match", priority: 1 }
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?operatorId=${nonExistentOperatorId}&gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(404);
      
      const errorData = await response.json();
      expect(errorData.message).toBe('Operator not found');
    });

    it("should use alias if operatorId is not provided", async () => {
      // Arrange
      const existingOperatorId = "67d291d943a96fad7f14ddae";
      const testAlias = "test-operator-alias";
      const gameId = 2001;
      
      await fetch(`${baseUrl}/api/operator/updateAlias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatorId: existingOperatorId,
          alias: testAlias,
        }),
      });

      const updateRequest = {
        mergeEvent: { eventType: "tournament", priority: 2 },
        patches: [{ op: "replace", path: "/status", value: "active" }]
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?alias=${testAlias}&gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('operatorId');
      expect(data).toHaveProperty('gameId', gameId);
      expect(data).toHaveProperty('mergeEvent');
      expect(data.mergeEvent).toEqual({ eventType: "tournament", priority: 2 });
      expect(data.patches).toEqual([{ op: "replace", path: "/status", value: "active" }]);
      expect(data.operatorId).toBe(existingOperatorId);
    });

    it("should create a new game integration if it doesn't exist", async () => {
      // Arrange
      const existingOperatorId = "67d291d943a96fad7f14ddae";
      const gameId = 2001;
      const updateRequest = {
        mergeEvent: { eventType: "live", priority: 3 },
        mergeEventDetails: [
          { detail: "live", value: true },
          { detail: "duration", value: 90 }
        ],
        patches: [
          { op: "add", path: "/config/timeout", value: 5000 },
          { op: "replace", path: "/status", value: "enabled" }
        ]
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?operatorId=${existingOperatorId}&gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('_id');
      expect(data).toHaveProperty('operatorId', existingOperatorId);
      expect(data).toHaveProperty('gameId', gameId);
      expect(data).toHaveProperty('mergeEvent');
      expect(data.mergeEvent).toEqual({ eventType: "live", priority: 3 });
      expect(data).toHaveProperty('mergeEventDetails');
      expect(data.mergeEventDetails).toEqual([
        { detail: "live", value: true },
        { detail: "duration", value: 90 }
      ]);
      expect(data).toHaveProperty('patches');
      expect(data.patches).toEqual([
        { op: "add", path: "/config/timeout", value: 5000 },
        { op: "replace", path: "/status", value: "enabled" }
      ]);
      
      expect(typeof data._id).toBe('string');
      expect(data._id.length).toBeGreaterThan(0);
    });

    it("should update existing game integration", async () => {
      // Arrange
      const existingOperatorId = "67d291d943a96fad7f14ddae";
      const gameId = 2001;
      
      const initialRequest = {
        mergeEvent: { eventType: "initial", priority: 1 }
      };

      const createResponse = await fetch(`${baseUrl}/api/gameIntegration/upsert?operatorId=${existingOperatorId}&gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initialRequest),
      });

      expect(createResponse.status).toBe(200);
      const createdData = await createResponse.json();
      const gameIntegrationId = createdData._id;

      const updateRequest = {
        mergeEvent: { eventType: "updated", priority: 5 },
        mergeEventDetails: [
          { detail: "updated", value: true }
        ],
        patches: [
          { op: "replace", path: "/status", value: "updated" },
          { op: "add", path: "/newField", value: "newValue" }
        ]
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?operatorId=${existingOperatorId}&gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('_id', gameIntegrationId);
      expect(data).toHaveProperty('operatorId', existingOperatorId);
      expect(data).toHaveProperty('gameId', gameId);
      
      expect(data.mergeEvent).toEqual({ eventType: "updated", priority: 5 });
      expect(data.mergeEventDetails).toEqual([
        { detail: "updated", value: true }
      ]);
      expect(data.patches).toEqual([
        { op: "replace", path: "/status", value: "updated" },
        { op: "add", path: "/newField", value: "newValue" }
      ]);
    });

    it("should create a new market integration if not provide id in market array", async () => {
      // Arrange
      const existingOperatorId = "67d291d943a96fad7f14ddae";
      const gameId = 2002;
      const updateRequest = {
        mergeEvent: { eventType: "live", priority: 1 },
        markets: [
          {
            name: "Test Market",
            merge: { marketID: 100, marketName: "Test Market Name" },
            selections: [
              { selectionID: 1, name: "Selection 1" },
              { selectionID: 2, name: "Selection 2" }
            ]
          }
        ]
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?operatorId=${existingOperatorId}&gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('markets');
      expect(Array.isArray(data.markets)).toBe(true);
      expect(data.markets.length).toBe(1);
      
      const marketId = data.markets[0];
      expect(typeof marketId).toBe('string');
      expect(marketId.length).toBe(24);
    });

    it("should update market integration if id and fields are provided", async () => {
      // Arrange
      const existingOperatorId = "67d291d943a96fad7f14ddae";
      const gameId = 2003;
      const existingMarketId = "6809fce26a798f36657e4c4d";
      
      const updateRequest = {
        mergeEvent: { eventType: "pre-match", priority: 2 },
        markets: [
          {
            id: existingMarketId,
            name: "Updated Market Name",
            merge: { marketID: 1, marketName: "Updated Handicap", updated: true },
            selections: [
              { selectionID: 1, name: "Updated Home", column: 1 },
              { selectionID: 2, name: "Updated Away", column: 2 }
            ]
          }
        ]
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?operatorId=${existingOperatorId}&gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      const databaseUri = process.env.DATABASE_URI ?? '';
      const databaseName = process.env.DATABASE_NAME ?? '';
      
      const client = new MongoClient(databaseUri);
      await client.connect();
      const db = client.db(databaseName);
      const marketIntegration = await db.collection('market_integrations').findOne({ _id: new ObjectId(existingMarketId) });
      await client.close();

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('markets');
      expect(Array.isArray(data.markets)).toBe(true);
      expect(data.markets.length).toBe(1);
      
      const marketId = data.markets[0];
      expect(marketId).toBe(existingMarketId);

      expect(marketIntegration).toEqual(expect.objectContaining({
        merge: expect.objectContaining({
          marketID: 1,
          marketName: "Updated Handicap",
          updated: true
        }),
        selections: [
          { selectionID: 1, name: "Updated Home", column: 1 },
          { selectionID: 2, name: "Updated Away", column: 2 }
        ]
      }));
    });

    it("should not update market integration if id is provided but no fields are provided", async () => {
      // Arrange
      const existingOperatorId = "67d291d943a96fad7f14ddae";
      const gameId = 2004;
      const existingMarketId = "680a038f6a798f36657e4c51";
      
      const updateRequest = {
        mergeEvent: { eventType: "in-play", priority: 3 },
        markets: [
          {
            id: existingMarketId
          }
        ]
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?operatorId=${existingOperatorId}&gameId=${gameId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('markets');
      expect(Array.isArray(data.markets)).toBe(true);
      expect(data.markets.length).toBe(1);
      
      const marketId = data.markets[0];
      expect(marketId).toBe(existingMarketId);
    });
  });
})
