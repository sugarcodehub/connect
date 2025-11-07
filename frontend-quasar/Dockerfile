FROM node:20-alpine as build

WORKDIR /app

# First, install the Quasar CLI globally
RUN npm install -g @quasar/cli

# Copy entire project
COPY . .

# Install dependencies
RUN npm install

# Build Quasar app for production
RUN quasar build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files from Quasar
COPY --from=build /app/dist/spa /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]