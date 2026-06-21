module.exports = {
  apps: [
    {
      name: "tarimkayit",
      script: "./server/src/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        // Diğer ortam değişkenlerini .env dosyasından okuyacaktır
      }
    }
  ]
};
