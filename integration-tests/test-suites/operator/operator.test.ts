import { addAdminAuth } from '../../utils/auth';

describe("Operator", () => {
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    
    describe("Generate", () => {
        it("should return 401 if not authenticated", async () => {
            // Act
            const response = await fetch(`${baseUrl}/api/operator/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Assert
            expect(response.status).toBe(401);
        });
      
        it("should generate an operator", async () => {
            // Act
            const response = await fetch(`${baseUrl}/api/operator/generate`, {
                method: 'POST',
                headers: addAdminAuth(),
            });
            
            // Assert
            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('operatorId');
            expect(data).toHaveProperty('password');
            expect(typeof data.operatorId).toBe('string');
            expect(typeof data.password).toBe('string');
            expect(data.operatorId.length).toBeGreaterThan(0);
            expect(data.password.length).toBeGreaterThan(0);
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
            
            // Assert
            expect(response.status).toBe(404);
            
            const errorData = await response.json();
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
    
    describe("Change password", () => {
        it("should return 401 if not authenticated", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/changePassword?operatorId=${existingOperatorId}`, {
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
            const response = await fetch(`${baseUrl}/api/operator/changePassword?operatorId=${existingOperatorId}`, {
                method: 'POST',
                headers: addAdminAuth(),
            });
            
            // Assert
            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('operatorId');
            expect(data).toHaveProperty('password');
            expect(data.operatorId).toBe(existingOperatorId);
            expect(typeof data.password).toBe('string');
            expect(data.password.length).toBeGreaterThan(0);
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
            const response = await fetch(`${baseUrl}/api/operator/changePassword?name=${testName}`, {
                method: 'POST',
                headers: addAdminAuth(),
            });
            
            // Assert
            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('operatorId');
            expect(data).toHaveProperty('password');
            expect(data.operatorId).toBe(existingOperatorId);
            expect(typeof data.password).toBe('string');
            expect(data.password.length).toBeGreaterThan(0);
        });

        it("should throw 404 if operator not found", async () => {
            // Arrange
            const nonExistentOperatorId = "507f1f77bcf86cd799439011";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/changePassword?operatorId=${nonExistentOperatorId}`, {
                method: 'POST',
                headers: addAdminAuth(),
            });
            
            // Assert
            expect(response.status).toBe(404);
            
            const errorData = await response.json();
            expect(errorData.message).toBe('Operator not found');
        });
    });
});
