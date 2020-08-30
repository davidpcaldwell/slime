#!/bin/bash
export BASE=$(dirname $0)/../../../../..
${BASE}/jsh.bash $(dirname $0)/jsapi-adapter.jsh.js "$@"
