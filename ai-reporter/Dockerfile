# Build context is the repo root (see deploy workflow): src/prompts.ts reads ../../docs/ai-reporter/prompts.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY ai-reporter/package*.json ./
RUN npm ci --omit=dev
COPY ai-reporter/src ./src
COPY docs/ai-reporter/prompts /docs/ai-reporter/prompts
CMD ["npm", "start"]
