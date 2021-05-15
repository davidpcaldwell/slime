#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

SLIME="$(dirname $0)/.."
if [ ! -d "${SLIME}/local/jdk/11" ]; then
	"${SLIME}/jsh.bash --add-jdk-11"
fi
export JSH_LAUNCHER_JDK_HOME=${SLIME}/local/jdk/11
${SLIME}/jsh.bash "$@"
