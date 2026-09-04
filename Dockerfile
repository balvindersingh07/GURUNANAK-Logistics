FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./

FROM node:20-alpine
WORKDIR /app
COPY --from=frontend-build /app/dist ./public
COPY --from=server /app/server ./server
WORKDIR /app/server
EXPOSE 5000
ENV NODE_ENV=production PORT=5000 CORS_ORIGIN=http://localhost:5173
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1
CMD ["node", "index.js"]
