#!/bin/bash
DIR="$(dirname $0)"
SLIME="${DIR}/../../../.."
export PROJECT="${SLIME}"
env PATH="${PATH}:${SLIME}/local/jsh/lib/node/bin" NODE_PATH="${SLIME}/local/jsh/lib/node/lib/node_modules" node ${DIR}/tsc.node.js "$@"
