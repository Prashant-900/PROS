FROM node:18

WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y python3
RUN npm init -y && npm install express cors ws child_process minio body-parser chokidar 

# Create a subfolder /app/templates
RUN mkdir templates

# Change working directory to the new folder when running the container
WORKDIR /app/templates

# Now when you run the container, your current directory is /app/templates,
# but server.js is still in /app, so you need to run node with the correct path:
CMD ["node", "../server.js"]
