import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir conexão com o Frontend Next.js
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validação global automática via class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Movies-Lib API')
    .setDescription(
      'API REST completa para o Movies-Lib: Autenticação JWT, Perfis de Usuários e Gerenciamento de Filmes/Séries Favoritos.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Cole seu token JWT gerado no login',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Movies-Lib API Docs',
  });

  const port = process.env.PORT || 3333;
  await app.listen(port);

  console.log(`\n======================================================`);
  console.log(`🚀 Movies-Lib API rodando em: http://localhost:${port}`);
  console.log(`📄 Swagger UI interativo em: http://localhost:${port}/api/docs`);
  console.log(`======================================================\n`);
}

bootstrap();
