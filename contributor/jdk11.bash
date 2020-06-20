#!/bin/bash
SLIME="$(dirname $0)/.."
if [ ! -d "${SLIME}/local/jdk/11" ]; then
	"${SLIME}/jsh.bash --add-jdk-11"
fi
export JSH_LAUNCHER_JDK_HOME=${SLIME}/local/jdk/11
${SLIME}/jsh.bash "$@"
