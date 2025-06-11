# ---------- Build Stage ----------
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the app source code
COPY . .

# Build the project (for TypeScript)
RUN npm run build

# ---------- Runtime Stage ----------
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy built files and dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the default server port (if using `serve`)
EXPOSE 3000

# Set default entrypoint to the CLI
ENTRYPOINT ["node", "./dist/index.js"]