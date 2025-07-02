import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { networkInterfaces } from 'os';
import * as morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(morgan('dev'));

  if (process.env.NODE_ENV === 'development') {
    app.enableCors();
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  let config = new DocumentBuilder()
    .setTitle('Marble Odd Feed Admin API')
    .setDescription('The Admin API documentation for Marble Odds Feed')
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
    console.info(
      'Proxy-aware configuration enabled - will work behind any reverse proxy',
    );
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
