#!/bin/bash
BASE="$(dirname $0)/../../../.."
DIR="$(dirname $0)"
export NODE_PATH="${BASE}/local/jsh/lib/node/lib/node_modules"
"${BASE}/local/jsh/lib/node/bin/node" $DIR/official-printing-example.node.js "$@"
