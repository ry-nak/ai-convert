# Step 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve the app using Nginx
FROM nginx:alpine

# 1. Copy the built files from Vite (dist folder)
COPY --from=build /app/dist /usr/share/nginx/html

# 2. Add a custom Nginx config to handle React Router and the Railway Port
# This script creates an nginx config on the fly to use the $PORT variable
RUN printf "server {\n\
    listen %s;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files \$uri \$uri/ /index.html;\n\
    }\n\
}\n" '$PORT' > /etc/nginx/conf.d/default.conf

# Railway provides the PORT environment variable
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]