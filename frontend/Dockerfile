FROM node:lts-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies (including devDependencies for build)
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy rest of the source code
COPY . .

# Build the Next.js app
RUN npm run build

# Set environment variable for production
ENV NODE_ENV=production

EXPOSE 3000
# Run as non-root user (optional, but good practice)
RUN chown -R node /usr/src/app
USER node

# Start the Next.js production server
CMD ["npm", "start"]
