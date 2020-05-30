#!/bin/bash
DIR="$(dirname $0)"
BASE="${DIR}/../../../.."
"${BASE}/jsh.bash" "${DIR}/test.jsh.js" "$@"
