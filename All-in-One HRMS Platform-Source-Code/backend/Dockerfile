# Base Stage
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development Stage
FROM base AS development
RUN npm install
COPY . .
RUN npm run prisma:generate
RUN npm run build

# Production Stage
FROM base AS production
ENV NODE_ENV production
RUN npm install --only=production
COPY --from=development /app/dist ./dist
COPY --from=development /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

# Expose the API port
EXPOSE 3000

# Start the server
CMD ["node", "dist/main"]
