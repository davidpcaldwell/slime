#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

SLIME="$(dirname $0)/../../../.."
#export JSH_DEBUG_SCRIPT=ncdbg
#${SLIME}/jsh.bash ${SLIME}/jsh/test/jsh-data.jsh.js
${SLIME}/jsh.bash ${SLIME}/jsh/tools/ncdbg.jsh.js -ncdbg:chrome:instance ${SLIME}/local/chrome/test/ncdbg ${SLIME}/jsh/test/jsh-data.jsh.js
