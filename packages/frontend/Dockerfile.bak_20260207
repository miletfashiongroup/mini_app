FROM node:20-alpine AS build
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_APP_BASE_URL=http://localhost
WORKDIR /app
ENV CI=1     npm_config_registry=https://registry.npmjs.org/     npm_config_fetch_retries=5     npm_config_fetch_retry_mintimeout=20000     npm_config_fetch_retry_maxtimeout=120000     VITE_API_BASE_URL=$VITE_API_BASE_URL     VITE_APP_BASE_URL=$VITE_APP_BASE_URL

COPY packages/frontend/package.json packages/frontend/package-lock.json ./
RUN HUSKY=0 npm install --no-audit --progress=false --legacy-peer-deps --ignore-scripts
COPY packages/frontend/ ./
RUN npm rebuild esbuild
RUN npm run build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY infra/nginx/app.conf /etc/nginx/conf.d/default.conf

RUN addgroup -S www && adduser -S www -G www     && chown -R www:www /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d
USER www
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
