import { Test, TestingModule } from "@nestjs/testing";
import { HealthcheckController } from "../healthcheck.controller";
import { HealthcheckService } from "../healthcheck.service";
import { ServiceUnavailableException } from "@nestjs/common";

describe("HealthcheckController", () => {
  let controller: HealthcheckController;
  let service: HealthcheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthcheckController],
      providers: [
        {
          provide: HealthcheckService,
          useValue: {
            healthCheck: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthcheckController>(HealthcheckController);
    service = module.get<HealthcheckService>(HealthcheckService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("healthCheck", () => {
    it("should return health check response when service is healthy", async () => {
      // arrange
      const expectedResponse = {
        messge: "API is running in test environment",
        timestamp: "2024-03-20T00:00:00.000Z",
      };
      jest.spyOn(service, "healthCheck").mockResolvedValue(expectedResponse);

      // act
      const result = await controller.healthCheck();

      // assert
      expect(result).toEqual(expectedResponse);
      expect(service.healthCheck).toHaveBeenCalledTimes(1);
    });

    it("should throw ServiceUnavailableException when database is down", async () => {
      // arrange
      const expectedError = new ServiceUnavailableException({
        message: "API is running but database is unavailable, test environment",
        timestamp: "2024-03-20T00:00:00.000Z",
        database: {
          error: "DB down",
          state: "disconnected",
        },
      });
      jest.spyOn(service, "healthCheck").mockRejectedValue(expectedError);

      // act
      const result = controller.healthCheck();

      // assert
      await expect(result).rejects.toThrow(ServiceUnavailableException);
      expect(service.healthCheck).toHaveBeenCalledTimes(1);
    });
  });
});
