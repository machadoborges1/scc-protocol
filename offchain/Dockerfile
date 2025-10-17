# Stage 1: Development Environment
FROM node:18-alpine AS development

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy all config files needed for pnpm to install dependencies correctly
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY offchain/package.json ./offchain/
COPY contracts/package.json ./contracts/

# Install ALL dependencies (including devDependencies)
RUN pnpm install --prod=false

# Copy the rest of the source code
COPY . .

# The command to run the dev server will be provided by docker-compose

# --- #

# Stage 2: Build Environment
FROM node:18-alpine AS build

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy all config files needed for pnpm to install dependencies correctly
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY offchain/package.json ./offchain/
COPY contracts/package.json ./contracts/

# Install ALL dependencies (including devDependencies for the build)
RUN pnpm install --prod=false

# Copy the rest of the source code
COPY . .

# Build the specific offchain package
RUN pnpm --filter @scc/offchain run build

# --- #

# Stage 3: Production Environment
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy config files again for production install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY offchain/package.json ./offchain/

# Install ONLY production dependencies for the offchain package
RUN pnpm install --filter @scc/offchain --prod

# Copy the compiled code from the build stage
COPY --from=build /app/offchain/dist ./offchain/dist

# Define the command to run the application
# Use an absolute path from the workdir for maximum clarity
CMD [ "node", "offchain/dist/index.js" ]
