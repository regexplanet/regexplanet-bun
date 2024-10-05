# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
RUN apt-get update && apt-get install -y dumb-init
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production
#RUN bun test
RUN bun run build

# copy production dependencies and source code into final image
FROM oven/bun:distroless AS release
ARG COMMIT="(not set)"
ARG LASTMOD="(not set)"
ENV COMMIT=$COMMIT
ENV LASTMOD=$LASTMOD
WORKDIR /app
COPY ./static /app/static
COPY --from=prerelease /usr/src/app/dist/server.js /app
COPY --from=prerelease /usr/src/app/package.json /app
COPY --from=base /usr/bin/dumb-init /usr/bin/dumb-init

# run the app
USER nonroot
EXPOSE 4000
ENV PORT 4000
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD [ "bun", "run", "server.js" ]