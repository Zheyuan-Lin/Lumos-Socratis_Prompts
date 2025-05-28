FROM node:16-alpine

WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 4200

# Command to run the application
CMD ["ng", "serve", "--host", "0.0.0.0", "--disable-host-check"] 