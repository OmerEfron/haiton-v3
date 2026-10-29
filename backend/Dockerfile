# Build context is the repo root (see deploy workflow).
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
CMD ["npm", "start"]
