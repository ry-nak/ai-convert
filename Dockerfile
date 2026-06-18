# Step 1: Build Stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Production Stage
FROM nginx:alpine

# Copy built files from Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a basic config that we will modify at runtime
# We tell Nginx to listen on "8080" as a placeholder
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Use 'sed' to replace 8080 with the real $PORT provided by Railway at runtime
CMD ["sh", "-c", "sed -i 's/8080/'\"$PORT\"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]