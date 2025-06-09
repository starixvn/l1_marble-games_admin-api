import 'dotenv/config'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { networkInterfaces } from 'os';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/scalar', method: RequestMethod.GET},
      { path: '', method: RequestMethod.GET}
    ]
  });

  let config = new DocumentBuilder()
  .setTitle('Marble Odds Feed API')
  .setDescription('The API documentation for Marble Odds Feed')
  .setVersion('0.0')
  .addBearerAuth()
  .addServer(process.env.PROXY_PATH ?? '', 'Proxy Server')
  .build();
  

  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup('swagger', app, document);

  const port = process.env.PORT ?? 3000;
  const serverIp = getServerIp();
  
  await app.listen(port, () => {
    console.log(`Application is running on: http://${serverIp}:${port}`);
    console.info(
      `Swagger documentation available at: http://${serverIp}:${port}/swagger`,
    );
    console.info('Proxy-aware configuration enabled - will work behind any reverse proxy');
  });
}

function getServerIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (interfaces) {
      for (const net of interfaces) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
}

bootstrap();
