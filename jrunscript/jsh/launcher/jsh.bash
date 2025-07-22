#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

if [ -n "$JSH_LAUNCHER_COMMAND_DEBUG" ]; then
	set -x
	>&2 echo "####################"
	>&2 echo "### SOURCING jsh ###"
	>&2 echo "####################"
	>&2 echo "Positional arguments: $@"
fi

set -- "--shell-configure" "$@"
export JSH_LOCAL_JDKS="${JSH_LOCAL_JDKS:-$(dirname $0)/jdk}"
export JSH_SHELL_LIB="${JSH_SHELL_LIB:-$(dirname $0)/lib}"
source "$(dirname $0)/src/jsh"
shift 1

#	TODO handle $JRUNSCRIPT being empty
JSH_LAUNCHER_SCRIPT=$(dirname $0)/jsh.js
if [ ! -f "$JSH_LAUNCHER_SCRIPT" ]; then
	echo "Missing jsh launcher script at $JSH_LAUNCHER_SCRIPT"
	exit 1
fi

case "`uname`" in
	CYGWIN*)
		JSH_LAUNCHER_SCRIPT=$(cygpath -wp $JSH_LAUNCHER_SCRIPT)
	;;
esac

>&2 echo "Positional arguments: $@"
$JRUNSCRIPT $JSH_LAUNCHER_SCRIPT "$@"
exit $?
