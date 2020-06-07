#!/bin/bash
DIR="$(dirname $0)"
BASE="${DIR}/../../../.."
export NODE_DEBUG
ARGUMENT="${DIR}/test/data/module.d.ts"
if [ -n "${SLIME}" ]; then
	ARGUMENT=""
fi
"${DIR}/tsc.bash" $ARGUMENT >"${BASE}/local/fifty/tsc.json" 2>"${BASE}/local/fifty/tsc.log"
