import { addAdminAuth } from '../../utils/auth';

describe("Operator", () => {
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    
    describe("Create", () => {
        it("should return 401 if not authenticated", async () => {
            // Act
            const response = await fetch(`${baseUrl}/api/operator/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Assert
            expect(response.status).toBe(401);
        });
      
        it("should create an operator", async () => {
            // Act
            const response = await fetch(`${baseUrl}/api/operator/create`, {
                method: 'POST',
                headers: addAdminAuth(),
            });
            const data = await response.json();
            
            // Assert
            expect(response.status).toBe(200);
            expect(data).toEqual(expect.objectContaining({
                operatorId: expect.any(String),
                password: expect.any(String)
            }));
        });
        it("should throw 409 if operator with same name already exists", async () => {
            // Arrange
            const testName = "duplicate-test-operator";
            
            await fetch(`${baseUrl}/api/operator/create`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({ name: testName }),
            });
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/create`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({ name: testName }),
            });
            const errorData = await response.json();
            
            // Assert
            expect(response.status).toBe(409);
            expect(errorData.message).toBe('Operator with this name already exists');
        });

        it("should create an operator with name provided", async () => {
            // Arrange
            const testName = "test-operator-with-name";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/create`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({ name: testName }),
            });
            const data = await response.json();
            
            // Assert
            expect(response.status).toBe(200);
            expect(data).toEqual(expect.objectContaining({
                operatorId: expect.any(String),
                password: expect.any(String),
                name: testName
            }));
        });
    });

    describe("Update name", () => {
        it("should return 401 if not authenticated", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            const newName = "updated-test-operator";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/updateName`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operatorId: existingOperatorId,
                    name: newName,
                }),
            });
            
            // Assert
            expect(response.status).toBe(401);
        });

        it("should update the name of the operator", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            const newName = "updated-test-operator";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/updateName`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({
                    operatorId: existingOperatorId,
                    name: newName,
                }),
            });
            
            // Assert
            expect(response.status).toBe(200);
        });

        it("should throw 404 if operator not found", async () => {
            // Arrange
            const nonExistentOperatorId = "507f1f77bcf86cd799439011";
            const newName = "test-name";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/updateName`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({
                    operatorId: nonExistentOperatorId,
                    name: newName,
                }),
            });
            const errorData = await response.json();
            
            // Assert
            expect(response.status).toBe(404);
            expect(errorData.message).toBe('Operator not found');
        });

        it("should throw 409 if operator with same name already exists", async () => {
            // Arrange
            const firstOperatorId = "67d291d943a96fad7f14ddae";
            const secondOperatorId = "507f1f77bcf86cd799439011";
            const duplicateName = "duplicate-test-operator";
            
            await fetch(`${baseUrl}/api/operator/updateName`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({
                    operatorId: firstOperatorId,
                    name: duplicateName,
                }),
            });
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/updateName`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({
                    operatorId: secondOperatorId,
                    name: duplicateName,
                }),
            });
            
            // Assert
            expect(response.status).toBe(409);
        });
    });
    
    describe("Generate password", () => {
        it("should return 401 if not authenticated", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/generatePassword?operatorId=${existingOperatorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            // Assert
            expect(response.status).toBe(401);
        });

        it("should generate new password for the operator", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/generatePassword?operatorId=${existingOperatorId}`, {
                method: 'POST',
                headers: addAdminAuth(),
            });
            const data = await response.json();
            
            // Assert
            expect(response.status).toBe(200);
            expect(data).toEqual(expect.objectContaining({
                operatorId: existingOperatorId,
                password: expect.any(String)
            }));
        });

        it("should use name if operatorId is not provided", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            const testName = "test-operator-name";
            
            await fetch(`${baseUrl}/api/operator/updateName`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({
                    operatorId: existingOperatorId,
                    name: testName,
                }),
            });
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/generatePassword?name=${testName}`, {
                method: 'POST',
                headers: addAdminAuth(),
            });
            const data = await response.json();
            
            // Assert
            expect(response.status).toBe(200);
            expect(data).toEqual(expect.objectContaining({
                operatorId: existingOperatorId,
                password: expect.any(String)
            }));
        });

        it("should throw 404 if operator not found", async () => {
            // Arrange
            const nonExistentOperatorId = "507f1f77bcf86cd799439011";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/generatePassword?operatorId=${nonExistentOperatorId}`, {
                method: 'POST',
                headers: addAdminAuth(),
            });
            const errorData = await response.json();
            
            // Assert
            expect(response.status).toBe(404);
            expect(errorData.message).toBe('Operator not found');
        });
    });

    describe("Get operator", () => {
        it("should return 401 if not authenticated", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/get?operatorId=${existingOperatorId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            // Assert
            expect(response.status).toBe(401);
        });

        it("should return 400 if operatorId and name are not provided", async () => {
            // Act
            const response = await fetch(`${baseUrl}/api/operator/get`, {
                method: 'GET',
                headers: addAdminAuth(),
            });
            
            // Assert
            expect(response.status).toBe(400);
        });

        it("should return 404 if operator not found", async () => {
            // Arrange
            const nonExistentOperatorId = "507f1f77bcf86cd799439011";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/get?operatorId=${nonExistentOperatorId}`, {
                method: 'GET',
                headers: addAdminAuth(),
            });
            
            // Assert
            expect(response.status).toBe(404);
            
            const errorData = await response.json();
            expect(errorData).toEqual({
                message: 'Operator not found',
                error: 'Not Found',
                statusCode: 404
            });
        });

        it("should return the operator if operatorId is provided", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/get?operatorId=${existingOperatorId}`, {
                method: 'GET',
                headers: addAdminAuth(),
            });
            const data = await response.json();
            
            // Assert
            expect(response.status).toBe(200);
            expect(data).toEqual(expect.objectContaining({
                id: existingOperatorId,
                name: expect.any(String)
            }));
        });
        
        it("should return the operator if name is provided", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            const testName = "test-operator-get-by-name";
            
            await fetch(`${baseUrl}/api/operator/updateName`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({
                    operatorId: existingOperatorId,
                    name: testName,
                }),
            });
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/get?name=${encodeURIComponent(testName)}`, {
                method: 'GET',
                headers: addAdminAuth(),
            });
            const data = await response.json();
            
            // Assert
            expect(response.status).toBe(200);
            expect(data).toEqual({
                id: existingOperatorId,
                name: testName
            });
        });

        it("should prioritize operatorId over name when both are provided", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            const someOtherName = "some-other-name";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/get?operatorId=${existingOperatorId}&name=${encodeURIComponent(someOtherName)}`, {
                method: 'GET',
                headers: addAdminAuth(),
            });
            const data = await response.json();
            
            // Assert
            expect(response.status).toBe(200);
            expect(data).toEqual(expect.objectContaining({
                id: existingOperatorId,
                name: expect.any(String)
            }));
        });
    });

    describe("Get all operators", () => {
        it("should return 401 if not authenticated", async () => {
            // Act
            const response = await fetch(`${baseUrl}/api/operator/list`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            // Assert
            expect(response.status).toBe(401);
        });

        it("should return all operators with exact structure", async () => {
            // Act
            const response = await fetch(`${baseUrl}/api/operator/list`, {
                method: 'GET',
                headers: addAdminAuth(),
            });
            
            // Assert
            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
            
            data.forEach((operator: any) => {
                expect(operator).toEqual(expect.objectContaining({
                    id: expect.any(String)
                }));
                if (operator.hasOwnProperty('name')) {
                    expect(typeof operator.name).toBe('string');
                }
            });
        });

        it("should return operators with field transformation", async () => {
            // Arrange
            const createResponse = await fetch(`${baseUrl}/api/operator/create`, {
                method: 'POST',
                headers: addAdminAuth(),
            });
            const createdOperator = await createResponse.json();
            const testName = "test-list-operator";
            
            await fetch(`${baseUrl}/api/operator/updateName`, {
                method: 'POST',
                headers: addAdminAuth(),
                body: JSON.stringify({
                    operatorId: createdOperator.operatorId,
                    name: testName,
                }),
            });
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/list`, {
                method: 'GET',
                headers: addAdminAuth(),
            });
            const data = await response.json();
            const testOperator = data.find((op: any) => op.id === createdOperator.operatorId);
            
            // Assert
            expect(response.status).toBe(200);
            expect(testOperator).toEqual({
                id: createdOperator.operatorId,
                name: testName
            });
        });
    });
});
