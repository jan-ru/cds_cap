FROM node:20-alpine

WORKDIR /app

# Copy package and lock file
COPY package.json package-lock.json ./

# Install production dependencies
# Install dependencies
RUN npm install --legacy-peer-deps --production=false

# Copy source code
COPY . .

# Initialize Database
RUN npm run deploy

# Expose default CAP port
EXPOSE 4004

# Start server
CMD ["npm", "start"]
