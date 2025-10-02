# 1. Base Image
FROM node:18-alpine

# Install curl for health checks
RUN apk add curl

# 2. Install pnpm
RUN npm install -g pnpm

# 3. Set Work Directory
WORKDIR /app

# 4. Copy Workspace Configs
# This allows pnpm to understand the monorepo structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 5. Copy the specific package's config
COPY offchain/package.json ./offchain/

# 6. Install ALL dependencies (dev and prod) for the 'offchain' package
# We need dev dependencies for 'tsc'
RUN pnpm install --filter @scc/offchain

# 7. Copy the source code for the package
COPY offchain/ ./offchain/

# 8. Build the TypeScript code
RUN pnpm --filter @scc/offchain run build

# 9. Define the command to run the application
CMD [ "pnpm", "--filter", "@scc/offchain", "start" ]
