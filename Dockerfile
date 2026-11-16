FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# The production build has no runtime or build dependencies.
COPY scripts ./scripts
COPY assets ./assets
COPY brand ./brand
COPY favicon.svg ./
RUN node scripts/build.mjs

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 WAITLIST_DB=/var/lib/prospect/waitlist.sqlite
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.mjs ./
COPY package.json ./
COPY scripts/export-waitlist.mjs ./scripts/export-waitlist.mjs
RUN mkdir -p /var/lib/prospect && chown node:node /var/lib/prospect
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
