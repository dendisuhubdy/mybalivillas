# =============================================================================
# MyBaliVilla.com - Admin Panel Dockerfile
# Multi-stage build for the Next.js admin dashboard
#
# NOTE: Requires next.config.js to have `output: 'standalone'` set:
#   /** @type {import('next').NextConfig} */
#   const nextConfig = {
#     output: 'standalone',
#   };
#   module.exports = nextConfig;
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Dependencies - Install node modules
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install dependencies using clean install for reproducible builds
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2: Builder - Build the Next.js application
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Build the Next.js application
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Runner - Minimal production image
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set ownership to the non-root user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
