# Stage 1: Build Backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY src/package*.json ./
RUN npm ci
COPY src/ .
RUN npm run build

# Stage 2: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 3: Production Server
FROM node:20-alpine
WORKDIR /app

# Copy Backend Build
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/package.json ./

# Serve static frontend with NestJS (or assume Nginx ingress in production cluster)
# For simplicity in this monorepo, we place frontend inside a public folder served by NestJS
COPY --from=frontend-build /app/dist ./public

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
