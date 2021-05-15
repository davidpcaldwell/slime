#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

export SLIME="$(dirname ${BASH_SOURCE})/../../.."
LOCAL="${HOME}/local"
if [ ! -d "${LOCAL}" ]; then
	mkdir -p "${LOCAL}"
fi
export JSH_LOCAL_JDKS="${LOCAL}/jdk"
export JSH_SHELL_LIB="${LOCAL}/jsh/lib"
export SLIME_WF_JDK_8=${JSH_LOCAL_JDKS}/default
