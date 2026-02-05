# Build stage
FROM node:18-alpine AS builder

# Install build dependencies for Sharp
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm ci

# Copy backend source code
COPY backend ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies for Sharp
RUN apk add --no-cache vips

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install production dependencies only
WORKDIR /app/backend
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/backend/dist ./dist

# Copy frontend files
COPY frontend /app/frontend

# Create storage directory
RUN mkdir -p /app/backend/storage/original /app/backend/storage/processed /app/backend/storage/downloads

# Set environment
ENV NODE_ENV=production

WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
