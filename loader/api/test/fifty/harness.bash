#!/bin/bash
DIR="$(dirname $0)"
BASE="${DIR}/../../../.."
${DIR}/tsdoc.bash -file ${DIR}/module.d.ts -ast ${BASE}/local/fifty/ast.json -to ${BASE}/local/fifty/context.json "$@"
