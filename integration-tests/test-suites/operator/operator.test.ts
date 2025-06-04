describe("Operator", () => {
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    
    describe("Generate", () => {
        it("should generate an operator", async () => {
            // Act
            const response = await fetch(`${baseUrl}/api/operator/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

    describe("Update alias", () => {
        it("should update the alias of the operator", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            const newAlias = "updated-test-operator";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/updateAlias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operatorId: existingOperatorId,
                    alias: newAlias,
                }),
            });
            
            // Assert
            expect(response.status).toBe(200);
        });

        it("should throw 404 if operator not found", async () => {
            // Arrange
            const nonExistentOperatorId = "507f1f77bcf86cd799439011";
            const newAlias = "test-alias";
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/updateAlias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operatorId: nonExistentOperatorId,
                    alias: newAlias,
                }),
            });
            
            // Assert
            expect(response.status).toBe(404);
            
            const errorData = await response.json();
            expect(errorData.message).toBe('Operator not found');
        });
    });
    
    describe("Change password", () => {
        it("should generate new password for the operator", async () => {
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
            expect(response.status).toBe(200);
            
            const data = await response.json();
            expect(data).toHaveProperty('operatorId');
            expect(data).toHaveProperty('password');
            expect(data.operatorId).toBe(existingOperatorId);
            expect(typeof data.password).toBe('string');
            expect(data.password.length).toBeGreaterThan(0);
        });

        it("should use alias if operatorId is not provided", async () => {
            // Arrange
            const existingOperatorId = "67d291d943a96fad7f14ddae";
            const testAlias = "test-operator-alias";
            
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
            
            // Act
            const response = await fetch(`${baseUrl}/api/operator/changePassword?alias=${testAlias}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            // Assert
            expect(response.status).toBe(404);
            
            const errorData = await response.json();
            expect(errorData.message).toBe('Operator not found');
        });
    });
});
