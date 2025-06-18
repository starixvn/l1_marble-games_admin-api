describe(('Healthcheck'), () => {
  it('should return 200 status for root endpoint', async () => {
    
    // Arrange
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    
    // Act
    const response = await fetch(baseUrl);
    
    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toBeDefined();
  });
}); 
