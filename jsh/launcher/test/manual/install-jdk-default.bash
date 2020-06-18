#!/bin/bash
SLIME="$(dirname $0)/../../../.."
rm -Rvf "${SLIME}/local/jdk/default"
${SLIME}/jsh.bash --install-jdk
LOGS="${SLIME}/local/test/jsh/launcher/install-jdk-default"
mkdir -p "${LOGS}"
>&2 echo "Running test suite at contributor/suite.jsh.js, starting at $(date) ..."
${SLIME}/jsh.bash ${SLIME}/contributor/suite.jsh.js "$@" >${LOGS}/stdout.txt 2>${LOGS}/stderr.txt