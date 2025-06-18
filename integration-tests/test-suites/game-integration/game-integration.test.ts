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
      
      const market = data.markets[0];
      expect(typeof market).toBe('object');
      expect(market).toHaveProperty('id');
      expect(typeof market.id).toBe('string');
      expect(market.id.length).toBe(24);
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
      
      const market = data.markets[0];
      expect(market.id).toBe(existingMarketId);

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
      
      const market = data.markets[0];
      expect(market.id).toBe(existingMarketId);
    });
  });

  describe("Get", () => {
    describe("No operatorId or alias provided", () => {
      it("should throw 400", async () => {
        // Arrange
        const gameId = 3001;

        // Act
        const response = await fetch(`${baseUrl}/api/gameIntegration/get?gameId=${gameId}`, {
          method: 'GET',
          headers: addAdminAuth(),
        });

        // Assert
        expect(response.status).toBe(400);
      });
    });

    describe("operator not found", () => {
      it("should throw 404", async () => {
        // Arrange
        const nonExistentOperatorId = "000000000000000000000000";
        const gameId = 3002;

        // Act
        const response = await fetch(`${baseUrl}/api/gameIntegration/get?operatorId=${nonExistentOperatorId}&gameId=${gameId}`, {
          method: 'GET',
          headers: addAdminAuth(),
        });

        // Assert
        expect(response.status).toBe(404);
      });
    });

    describe("game integration not found", () => {
      it("should throw 404", async () => {
        // Arrange
        const existingOperatorId = "67d291d943a96fad7f14ddae";
        const nonExistentGameId = 99999;

        // Act
        const response = await fetch(`${baseUrl}/api/gameIntegration/get?operatorId=${existingOperatorId}&gameId=${nonExistentGameId}`, {
          method: 'GET',
          headers: addAdminAuth(),
        });

        // Assert
        expect(response.status).toBe(404);
      });
    })

    it("should return game integration", async () => {
      // Arrange
      const existingOperatorId = "67d291d943a96fad7f14ddae";
      const gameId = 3003;
      
      const upsertRequest = {
        "mergeEvent": {
          "productCode": "SM_CLUB_WC_25",
          "productTypeKey": "MARBLE",
          "_id": null,
          "__v": null,
          "streamServer": "$STREAM_SERVER",
          "videoExtension": "mp4",
          "goalInfo": null,
          "playlist": null,
          "result": null
        },
        "mergeEventDetails": [],
        "patches": [
          {
            "op": "remove",
            "path": "/streamServer"
          },
          {
            "op": "remove",
            "path": "/videoExtension"
          },
          {
            "op": "remove",
            "path": "/eventDetails/0/selections"
          },
          {
            "op": "remove",
            "path": "/eventDetails/1/selections"
          },
          {
            "op": "remove",
            "path": "/gameId"
          }
        ],
        "markets": [
          { 
            "id": "684957076f3aab5c92f20f8f",
            "merge": {
              "marketID": 1,
              "marketNameKey": "MARKET_HANDICAP",
              "marketName": "Handicap"
            },
            "selections": [
              {
                "selectionID": 1,
                "column": 1,
                "selectionOrder": 1,
                "selectionNameLongKey": "HOME_WIN",
                "name": "ft_hdp_home",
                "settlementStatus": null
              },
              {
                "selectionID": 2,
                "column": 2,
                "selectionOrder": 1,
                "selectionNameLongKey": "AWAY_WIN",
                "name": "ft_hdp_away",
                "settlementStatus": null
              }
            ]
          },
          {
            "id": "684957076f3aab5c92f20f90",
            "merge": {
              "marketID": 2,
              "marketNameKey": "MARKET_1H_HANDICAP",
              "marketName": "1H Handicap"
            },
            "selections": [
              {
                "selectionID": 3,
                "column": 1,
                "selectionOrder": 1,
                "selectionNameLongKey": "HOME_WIN",
                "name": "h1_hdp_home",
                 "settlementStatus": null
              },
              {
                "selectionID": 4,
                "column": 2,
                "selectionOrder": 1,
                "selectionNameLongKey": "AWAY_WIN",
                "name": "h1_hdp_away",
                "settlementStatus": null
              }
            ]
          },
          {
            "id": "684957076f3aab5c92f20f91",
            "merge": {
              "marketID": 3,
              "marketNameKey": "MARKET_OVER_UNDER",
              "marketName": "Over/Under"
            },
            "selections": [
              {
                "selectionID": 5,
                "column": 1,
                "selectionOrder": 1,
                "selectionNameLongKey": "OVER",
                "name": "ft_ou_over",
                "settlementStatus": null
              },
              {
                "selectionID": 6,
                "column": 2,
                "selectionOrder": 1,
                "selectionNameLongKey": "UNDER",
                "name": "ft_ou_under",
                "settlementStatus": null
              }
            ]
          },
          {
            "id": "684957076f3aab5c92f20f92",
            "merge": {
              "marketID": 4,
              "marketNameKey": "MARKET_1H_OVER_UNDER",
              "marketName": "1H Over/Under"
            },
            "selections": [
              {
                "selectionID": 7,
                "column": 1,
                "selectionOrder": 1,
                "selectionNameLongKey": "OVER",
                "name": "h1_ou_over",
                "settlementStatus": null
              },
              {
                "selectionID": 8,
                "column": 2,
                "selectionOrder": 1,
                "selectionNameLongKey": "UNDER",
                "name": "h1_ou_under",
                "settlementStatus": null
              }
            ]
          },
          {
            "id": "684957076f3aab5c92f20f93",
            "merge": {
              "marketID": 5,
              "marketNameKey": "MARKET_EVEN_ODD",
              "marketName": "Odd/Even"
            },
            "selections": [
              {
                "selectionID": 9,
                "column": 1,
                "selectionOrder": 1,
                "selectionNameLongKey": "EVEN",
                "name": "ft_oe_even",
                "settlementStatus": null
              },
              {
                "selectionID": 10,
                "column": 2,
                "selectionOrder": 1,
                "selectionNameLongKey": "ODD",
                "name": "ft_oe_odd",
                "settlementStatus": null
              }
            ]
          },
          {
            "id": "684957076f3aab5c92f20f94",
            "merge": {
              "marketID": 6,
              "marketNameKey": "MARKET_1H_EVEN_ODD",
              "marketName": "1H Odd/Even"
            },
            "selections": [
              {
                "selectionID": 11,
                "column": 1,
                "selectionOrder": 1,
                "selectionNameLongKey": "EVEN",
                "name": "h1_oe_even",
                "settlementStatus": null
              },
              {
                "selectionID": 12,
                "column": 2,
                "selectionOrder": 1,
                "selectionNameLongKey": "ODD",
                "name": "h1_oe_odd",
                "settlementStatus": null
              }
            ]
          },
          {
            "id": "684957076f3aab5c92f20f95",
            "merge": {
              "marketID": 7,
              "marketNameKey": "MARKET_1X2",
              "marketName": "1X2"
            },
            "selections": [
              {
                "selectionID": 13,
                "column": 1,
                "selectionOrder": 1,
                "selectionNameLongKey": "HOME",
                "name": "ft_1x2_home",
                "settlementStatus": null
              },
              {
                "selectionID": 14,
                "column": 2,
                "selectionOrder": 1,
                "selectionNameLongKey": "AWAY",
                "name": "ft_1x2_away",
                "settlementStatus": null
              },
              {
                "selectionID": 15,
                "column": 3,
                "selectionOrder": 1,
                "selectionNameLongKey": "TIE",
                "name": "ft_1x2_draw",
                "settlementStatus": null
              }
            ]
          },
          {
            "id": "684957076f3aab5c92f20f96",
            "merge": {
              "marketID": 8,
              "marketNameKey": "MARKET_1H_1X2",
              "marketName": "1H 1X2"
            },
            "selections": [
              {
                "selectionID": 16,
                "column": 1,
                "selectionOrder": 1,
                "selectionNameLongKey": "HOME",
                "name": "h1_1x2_home",
                "settlementStatus": null
              },
              {
                "selectionID": 17,
                "column": 2,
                "selectionOrder": 1,
                "selectionNameLongKey": "AWAY",
                "name": "h1_1x2_away",
                "settlementStatus": null
              },
              {
                "selectionID": 18,
                "column": 3,
                "selectionOrder": 1,
                "selectionNameLongKey": "TIE",
                "name": "h1_1x2_draw",
                "settlementStatus": null
              }
            ]
          }
        ]
      };

      const expectedResponse = {
        ...upsertRequest
      };

      const upsertResponse = await fetch(`${baseUrl}/api/gameIntegration/upsert?operatorId=${existingOperatorId}&gameId=${gameId}`, {
        method: 'POST',
        headers: addAdminAuth(),
        body: JSON.stringify(upsertRequest),
      });

      await upsertResponse.json();

      // Act
      const response = await fetch(`${baseUrl}/api/gameIntegration/get?operatorId=${existingOperatorId}&gameId=${gameId}`, {
        method: 'GET',
        headers: addAdminAuth(),
      });
      const data = await response.json();

      // Assert
      expect(data).toEqual(expectedResponse);
    });
    
  });
})
