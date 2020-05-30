#!/bin/bash
DIR="$(dirname $0)"
SRC="$(dirname $0)/../../../.."
"${SRC}/jsh.bash" "${DIR}/ui/main.jsh.js" "$@"
