# Images API

[![Test](https://github.com/arashkevich25/nodejs-images-api/actions/workflows/test.yml/badge.svg)](https://github.com/arashkevich25/nodejs-images-api/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/arashkevich25/nodejs-images-api/branch/main/graph/badge.svg)](https://codecov.io/gh/arashkevich25/nodejs-images-api)

REST API for uploading and serving images built with NestJS, TypeORM, PostgreSQL and Sharp.

## Run

```bash
docker compose up
```

API available at http://localhost:3000, Swagger at http://localhost:3000/api/docs

## Test

```bash
cd api
npm ci
npm test
npm run test:e2e
npm run test:cov
```
