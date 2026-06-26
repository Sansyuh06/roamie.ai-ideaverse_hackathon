FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy prisma schema
COPY apps/api/prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY apps/api/src ./src/
COPY apps/api/tsconfig.json ./

# Build TypeScript
RUN npx tsc --skipLibCheck

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
