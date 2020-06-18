#!/bin/bash
SLIME="$(dirname $0)/../../../.."
#export JSH_DEBUG_SCRIPT=ncdbg
#${SLIME}/jsh.bash ${SLIME}/jsh/test/jsh-data.jsh.js
${SLIME}/jsh.bash ${SLIME}/jsh/tools/ncdbg.jsh.js -ncdbg:chrome:instance ${SLIME}/local/chrome/test/ncdbg ${SLIME}/jsh/test/jsh-data.jsh.js
