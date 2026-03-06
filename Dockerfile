# Stage 1: Build the NestJS backend
FROM node:20-alpine AS backend-build
WORKDIR /app/src
COPY src/package*.json ./
RUN npm ci
COPY src/ ./
RUN npm run build

# Stage 2: Build the React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# We can provide a build argument or default URL for the production API
ENV VITE_API_URL=/api/v1
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine
WORKDIR /app/src
COPY --from=backend-build /app/src/dist ./dist
COPY --from=backend-build /app/src/node_modules ./node_modules
COPY --from=backend-build /app/src/package*.json ./

# Serve the static frontend build by copying it to the public directory
COPY --from=frontend-build /app/frontend/dist ./dist/public

# Expose port and start
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
