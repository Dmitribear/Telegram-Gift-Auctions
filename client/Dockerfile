FROM node:18-alpine AS build
WORKDIR /app

# Default API base for browser (host) access; override via --build-arg if needed
ARG VITE_API_BASE=http://localhost:3001
ENV VITE_API_BASE=${VITE_API_BASE}

COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY src ./src

RUN npm install
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]
