

FROM node:20-alpine AS build
ARG VITE_BACKEND_URL=http://localhost:8000
ARG VITE_APP_URL=http://localhost
WORKDIR /app
ENV CI=1 \
    VITE_BACKEND_URL=${VITE_BACKEND_URL} \
    VITE_APP_URL=${VITE_APP_URL}

# Install dependencies with a pristine node_modules tree
COPY packages/frontend/package.json packages/frontend/package-lock.json ./
RUN npm ci --no-audit --progress=false

# Copy sources after deps are installed so host artefacts never override node_modules
COPY packages/frontend/ ./

# Force esbuild binary to match the container OS even if lockfile dragged an older one
RUN npm rebuild esbuild

RUN npm run build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY infra/nginx/app.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
