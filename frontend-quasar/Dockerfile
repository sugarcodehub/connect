FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build Quasar app for production
RUN npx quasar build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files from Quasar
COPY --from=build /app/dist/spa /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]