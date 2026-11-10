# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci

FROM deps AS build
ARG SITE_ORIGIN=https://staging.example.test
ENV NEXT_PUBLIC_SITE_URL=$SITE_ORIGIN
ENV AUTH_URL=$SITE_ORIGIN
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @hackos/shared
RUN npm run build -w @hackos/web

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
