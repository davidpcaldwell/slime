#!/bin/bash
SLIME="$(dirname $0)/../../../.."
rm ${SLIME}/local/jsh/lib/js.jar 2>/dev/null
${SLIME}/jsh.bash ${SLIME}/jsh/tools/install/rhino.jsh.js -version mozilla/1.7.12 -replace
export JSH_DEBUG_SCRIPT=rhino
${SLIME}/jsh.bash ${SLIME}/jsh/test/jsh-data.jsh.js
