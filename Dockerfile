# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Run
FROM node:22-alpine AS runner

WORKDIR /app

# Only copy what's needed to run the SSR server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/kurath.dev/server/server.mjs"]
