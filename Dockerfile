FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/

# Install all workspace dependencies
RUN npm ci --workspace=packages/shared --workspace=packages/backend --include=dev

# Copy source code
COPY packages/shared packages/shared
COPY packages/backend packages/backend

# Build backend (nest build handles TS compilation)
WORKDIR /app/packages/backend
RUN rm -f tsconfig.tsbuildinfo && npx nest build

# Production
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main.js"]
