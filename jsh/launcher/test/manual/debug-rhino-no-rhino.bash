#!/bin/bash
SLIME="$(dirname $0)/../../../.."
env JSH_SHELL_LIB=/dev/null JSH_DEBUG_SCRIPT=rhino ${SLIME}/jsh.bash ${SLIME}/jsh/test/jsh-data.jsh.js
