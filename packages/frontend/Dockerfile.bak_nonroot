

FROM node:20-alpine AS build
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_APP_BASE_URL=http://localhost
WORKDIR /app
ENV CI=1 \
    npm_config_registry=https://registry.npmjs.org/ \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_APP_BASE_URL=${VITE_APP_BASE_URL}

# Install dependencies with a pristine node_modules tree; skip husky/prepare in container
COPY packages/frontend/package.json packages/frontend/package-lock.json ./
# Use install to tolerate minor lock drift in CI/build environments
RUN HUSKY=0 npm install --no-audit --progress=false --legacy-peer-deps --ignore-scripts

# Copy sources after deps are installed so host artefacts never override node_modules
COPY packages/frontend/ ./

# Force esbuild binary to match the container OS even if lockfile dragged an older one
RUN npm rebuild esbuild

RUN npm run build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
# Use canonical config path inside repo to avoid symlink issues
COPY infra/nginx/app.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
