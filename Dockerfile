# Step 1: Build the React application
FROM node:22-alpine AS builder

WORKDIR /app

# Cypress is only used for e2e tests, skip downloading its binary
ENV CYPRESS_INSTALL_BINARY=0

RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
