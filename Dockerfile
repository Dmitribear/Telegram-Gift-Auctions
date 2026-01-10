FROM node:18-alpine AS build
WORKDIR /app

# Backend deps
COPY package*.json tsconfig*.json ./
RUN npm install

# Source
COPY src ./src
COPY docs ./docs

# Build TS
RUN npm run build

FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
