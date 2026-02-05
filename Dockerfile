# Use Node 18 on Alpine for smaller image size
FROM node:18-alpine

# Install only runtime dependencies for Sharp (no build tools needed)
RUN apk add --no-cache vips-dev

WORKDIR /app/backend

# Copy package files and .npmrc first for better caching
COPY backend/package*.json ./
COPY backend/.npmrc ./

# Install ALL dependencies (we need devDependencies for TypeScript build)
# Sharp will download pre-built binaries thanks to .npmrc configuration
RUN npm install

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Copy frontend files
COPY frontend /app/frontend

# Create storage directories
RUN mkdir -p storage/original storage/processed storage/downloads

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
