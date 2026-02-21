# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only package files first (small, cacheable)
COPY package.json package-lock.json ./

# Install dependencies with timeout
RUN npm ci --omit=dev --legacy-peer-deps --prefer-offline --no-audit

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server.js"]
