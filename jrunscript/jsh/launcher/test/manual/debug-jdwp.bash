#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

SLIME=$(dirname $0)/../../../..
export JSH_DEBUG_JDWP=transport=dt_socket,address=8000,server=y,suspend=y
>&2 echo "*After* receiving message \"Listening for transport dt_socket at address: 8000\":"
#	TODO	might be able to clean up this messaging by getting job control working and launching script
#			in the background, then print the below messages
>&2 echo "In order to continue, attach Java debugger tool on port 8000"
>&2 echo "VSCode task in ${SLIME}/.vscode/launch.json is preconfigured for this purpose"
"${SLIME}/jsh.bash" "${SLIME}/jsh/test/jsh-data.jsh.js" "$@"
