# Build stage
FROM node:18-alpine AS builder

# Install build dependencies for Sharp
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies for Sharp
RUN apk add --no-cache vips

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy frontend files
COPY ../frontend ./frontend

# Create storage directory
RUN mkdir -p /app/storage/original /app/storage/processed /app/storage/downloads

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
