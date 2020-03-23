#!/bin/bash
BASE=$(dirname $0)/../../../../..
rm ${BASE}/local/jsh/lib/js.jar
"${BASE}/jsh.bash" "$(dirname $0)/rhino.jsh.js"
