# Images API

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
