#!/bin/bash
BASE=$(dirname $0)/..
env PATH="${PATH}:${BASE}/local/jsh/lib/node/bin" tsc -p ${TSCONFIG_JSON=jsconfig.json}
