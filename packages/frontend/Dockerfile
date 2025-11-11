# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build
WORKDIR /app
COPY packages/frontend/package.json ./package.json
COPY packages/frontend/package-lock.json ./package-lock.json
RUN npm ci
COPY packages/frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY infra/nginx/app.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
