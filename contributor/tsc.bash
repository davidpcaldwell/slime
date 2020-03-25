#!/bin/bash
BASE=$(dirname $0)/..
args="$@"
if [ -n "${TSCONFIG_JSON}" ]; then
	>&2 echo "DEPRECATED: use of TSCONFIG_JSON environment variable; use -tsconfig <pathname>"
	args="-tsconfig ${TSCONFIG_JSON}"
fi
"${BASE}/jsh.bash" $(dirname $0)/tsc.jsh.js ${args}
