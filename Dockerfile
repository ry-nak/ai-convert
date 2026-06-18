# Step 1: Build Stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Production Stage (Nginx)
FROM nginx:alpine

# Copy built files from Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Create Nginx config with a Proxy for /api
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    # THIS REPLACES THE VITE PROXY IN PRODUCTION \
    location /api/ { \
        proxy_pass https://ai-backend-production-522d.up.railway.app/; \
        proxy_set_header Host https://ai-backend-production-522d.up.railway.app; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_ssl_server_name on; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Replace 8080 with Railway Port and Start
CMD ["sh", "-c", "sed -i 's/8080/'\"$PORT\"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]