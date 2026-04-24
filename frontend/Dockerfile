# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# If using react-router, we need to add an nginx conf for SPA routing, but we are using state.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
