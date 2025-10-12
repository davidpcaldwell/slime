#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

SLIME="$(dirname $0)/../../../.."
COMMAND="${1:---install-jdk}"

${SLIME}/jsh ${COMMAND}

if [ -f "${SLIME}/local/jsh/lib/js.jar" ]; then
	rm "${SLIME}/local/jsh/lib/js.jar"
fi

if [ -n "${RHINO}" ]; then
	>&2 echo "Installing Rhino ..."
	"${SLIME}/jsh" "${SLIME}/jsh/tools/install/rhino.jsh.js"
fi

LOGS="${LOGS:-${SLIME}/local/test/jsh/launcher/install-jdk-default}"
mkdir -p "${LOGS}"

>&2 echo "Running test suite at contributor/suite.jsh.js, starting at $(date) ..."
<&2 echo "(Writing logs to ${LOGS})"
${SLIME}/jsh ${SLIME}/contributor/suite.jsh.js "$@" >${LOGS}/stdout.txt 2>${LOGS}/stderr.txt
>&2 echo "Exited with status $?."
