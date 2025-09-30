# 1. Base Image
FROM node:18-alpine

# 2. Install pnpm
RUN npm install -g pnpm

# 3. Set Work Directory
WORKDIR /app

# 4. Copy Workspace Configs
# This allows pnpm to understand the monorepo structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 5. Copy the specific package's config
COPY offchain/package.json ./offchain/

# 6. Install ONLY the production dependencies for the 'offchain' package
RUN pnpm install --filter @scc/offchain --prod

# 7. Copy the source code for the package
COPY offchain/ ./offchain/

# 8. Define the command to run the application
CMD [ "pnpm", "--filter", "@scc/offchain", "start" ]
