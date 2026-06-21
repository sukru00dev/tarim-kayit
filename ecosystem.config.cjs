module.exports = {
  apps: [
    {
      name: "tarim-kayit-api",
      script: "./server/src/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        // Diğer ortam değişkenlerini .env dosyasından okuyacaktır
      }
    }
  ]
};
