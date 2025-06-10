import { MongoClient, ObjectId } from 'mongodb';
import { addAdminAuth } from '../../utils/auth';

describe("Game Integration", () => {
  const baseUrl = global.__API_SERVICE__.getBaseUrl();
  
  describe("Upsert", () => {
    it("should return 401 if not authenticated", async () => {
      // Arrange
      const existingOperatorId = "67d291d943a96fad7f14ddae";
      const gameId = 2001;
      const updateRequest = {
        mergeEvent: { eventType: "match", priority: 1 }
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
      expect(response.status).toBe(401);
    });

    it("should throw 404 if operator not found (using name)", async () => {
      // Arrange
      const nonExistentName = `non-existent-operator-abadsfasdfa`;
      const gameId = 2001;
      const updateRequest = {
        mergeEvent: { eventType: "match", priority: 1 }
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?name=${nonExistentName}&gameId=${gameId}`, {
        method: 'POST',
        headers: addAdminAuth(),
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(404);
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
        headers: addAdminAuth(),
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(404);
    });

    it("should use name if operatorId is not provided", async () => {
      // Arrange
      const existingOperatorId = "67d291d943a96fad7f14ddae";
      const testName = `test-operator-name`;
      const gameId = 2001;
      
      await fetch(`${baseUrl}/api/operator/updateName`, {
        method: 'POST',
        headers: addAdminAuth(),
        body: JSON.stringify({
          operatorId: existingOperatorId,
          name: testName,
        }),
      });

      const updateRequest = {
        mergeEvent: { eventType: "tournament", priority: 2 },
        patches: [{ op: "replace", path: "/status", value: "active" }]
      };

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/upsert?name=${testName}&gameId=${gameId}`, {
        method: 'POST',
        headers: addAdminAuth(),
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      const expectedResult = {
        operatorId: existingOperatorId,
        gameId: gameId,
        mergeEvent: { eventType: "tournament", priority: 2 },
        patches: [{ op: "replace", path: "/status", value: "active" }]
      };
      
      expect(data).toMatchObject(expectedResult);
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
        headers: addAdminAuth(),
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          operatorId: existingOperatorId,
          gameId: gameId,
          mergeEvent: { eventType: "live", priority: 3 },
          mergeEventDetails: [
            { detail: "live", value: true },
            { detail: "duration", value: 90 }
          ],
          patches: [
            { op: "add", path: "/config/timeout", value: 5000 },
            { op: "replace", path: "/status", value: "enabled" }
          ]
        })
      );
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
        headers: addAdminAuth(),
        body: JSON.stringify(initialRequest),
      });

      expect(createResponse.status).toBe(200);

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
        headers: addAdminAuth(),
        body: JSON.stringify(updateRequest),
      });

      // Assert
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual(
        expect.objectContaining({
          operatorId: existingOperatorId,
          gameId: gameId,
          mergeEvent: { eventType: "updated", priority: 5 },
          mergeEventDetails: [
            { detail: "updated", value: true }
          ],
          patches: [
            { op: "replace", path: "/status", value: "updated" },
            { op: "add", path: "/newField", value: "newValue" }
          ]
        })
      );
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
        headers: addAdminAuth(),
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
        headers: addAdminAuth(),
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
        headers: addAdminAuth(),
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
