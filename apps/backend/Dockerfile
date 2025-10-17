FROM node:20-alpine AS base
WORKDIR /app

COPY apps/backend/package.json apps/backend/package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY apps/backend/tsconfig.json ./tsconfig.json
COPY apps/backend/src ./src

RUN npm run build

EXPOSE 8080
CMD ["node", "dist/index.js"]


