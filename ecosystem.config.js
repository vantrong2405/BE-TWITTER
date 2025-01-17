// eslint-disable-next-line no-undef

module.exports = {
  apps: [
    {
      name: 'twitter',
      script: 'node dist/index.js',
      env: {
        NODE_ENV: 'development', // Riêng NODE_ENV thì có thể dùng process.env
        TEN_BIEN: 'Gia tri',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
