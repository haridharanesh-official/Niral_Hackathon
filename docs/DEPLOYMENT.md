# Deployment

## Local infrastructure only

```bash
npm run docker:up
```

Starts Postgres, Redis, and Mailhog.

## Full stack containers

```bash
docker compose -f docker/docker-compose.yml --profile full up --build
```

Services:

- `web` → http://localhost:3000
- `api` → http://localhost:4000/api
- `postgres` → localhost:5432
- `redis` → localhost:6379
- `mailhog` → http://localhost:8025

## Production notes

1. Replace all secrets in `.env`
2. Run Prisma migrations against managed Postgres
3. Configure Google/GitHub OAuth apps
4. Point Cloudinary/Supabase credentials for uploads
5. Terminate TLS at your reverse proxy / load balancer
