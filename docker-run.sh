#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

docker build \
	--build-arg COMMIT=$(git rev-parse --short HEAD)-local \
	--build-arg LASTMOD=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
	--progress=plain \
	--tag regexplanet-bun \
	.

docker run \
	--env PORT='4000' \
	--env COMMIT=$(git rev-parse --short HEAD)-local \
	--env LASTMOD=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
	--expose 4000 \
	--name regexplanet-bun \
	--rm \
	--publish 4000:4000 \
	regexplanet-bun

