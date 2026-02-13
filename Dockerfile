# Stage 1: Full App
FROM node:20-alpine

# Install compatibility libraries for Next.js (required for Alpine)
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Build
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
# Increase memory
ENV NODE_OPTIONS=--max_old_space_size=4096

RUN npm run build

# Start

EXPOSE 8080
CMD ["sh", "-c", "npm start"]
