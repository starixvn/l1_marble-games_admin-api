import 'dotenv/config'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { INestApplication } from '@nestjs/common';

const API_DOC_PATH = '/scalar'

function generateAPIDocs(app: INestApplication) {
  const config = new DocumentBuilder()
  .setTitle('Internal Odds Feed API')
  .setDescription('Internal Odds Feed API Documentation')
  .setVersion('1.0')
  .build()

  const document = SwaggerModule.createDocument(app, config);

  app.use(
    API_DOC_PATH,
    apiReference({
      spec: {
        content: document,
      },
    }),
  )
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  generateAPIDocs(app);

  const port = process.env.PORT ?? 3000;

  await app.listen(port, () => {
    console.info(`Application API documentation serves at http://localhost:${port}${API_DOC_PATH}`)
  });

}
bootstrap();
