#!/bin/bash
SLIME="$(dirname $0)/../../../.."
COMMAND="${1:---install-jdk}"

${SLIME}/jsh.bash ${COMMAND}

if [ -f "${SLIME}/local/jsh/lib/js.jar" ]; then
	rm "${SLIME}/local/jsh/lib/js.jar"
fi

if [ -n "${RHINO}" ]; then
	>&2 echo "Installing Rhino: ${RHINO} ..."
	"${SLIME}/jsh.bash" "${SLIME}/jsh/tools/install/rhino.jsh.js" -version "${RHINO}"
fi

LOGS="${LOGS:-${SLIME}/local/test/jsh/launcher/install-jdk-default}"
mkdir -p "${LOGS}"

>&2 echo "Running test suite at contributor/suite.jsh.js, starting at $(date) ..."
<&2 echo "(Writing logs to ${LOGS})"
${SLIME}/jsh.bash ${SLIME}/contributor/suite.jsh.js "$@" >${LOGS}/stdout.txt 2>${LOGS}/stderr.txt
>&2 echo "Exited with status $?."
