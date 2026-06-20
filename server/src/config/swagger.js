import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tarımsal Maliyet ve Girdi Yönetim Sistemi API',
      version: '1.0.0',
      description:
        'Harran Üniversitesi Çok Disiplinli Mühendislik Projesi — RESTful API dokümantasyonu',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Geliştirme' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
