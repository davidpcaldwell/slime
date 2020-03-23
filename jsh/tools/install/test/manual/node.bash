#!/bin/bash
BASE=$(dirname $0)/../../../../..
rm -Rf ${BASE}/local/jsh/lib/node
"${BASE}/jsh.bash" "$(dirname $0)/node.jsh.js"

