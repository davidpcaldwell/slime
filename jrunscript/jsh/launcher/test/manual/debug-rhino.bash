#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

SLIME="$(dirname $0)/../../../.."
rm ${SLIME}/local/jsh/lib/js.jar 2>/dev/null
${SLIME}/jsh ${SLIME}/jsh/tools/install/rhino.jsh.js --replace
export JSH_DEBUG_SCRIPT=rhino
${SLIME}/jsh ${SLIME}/jsh/test/jsh-data.jsh.js
