FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm ci
COPY . .

ENV DATABASE_URL="postgresql://quizuser:quizpassword123@postgres:5432/quizdb?schema=public"

RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM base AS build
RUN npm ci
COPY . .

ENV DATABASE_URL="postgresql://quizuser:quizpassword123@postgres:5432/quizdb?schema=public"

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

FROM node:20-alpine AS production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma

ENV DATABASE_URL="postgresql://quizuser:quizpassword123@postgres:5432/quizdb?schema=public"

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["npm", "start"]