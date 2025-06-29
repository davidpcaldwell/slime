#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

if [ -n "$JSH_LAUNCHER_DEBUG" ]; then
	set -x
fi

if [ -z "$JSH_JAVA_HOME" ]; then
	JSH_LAUNCHER_JRUNSCRIPT=$(which jrunscript 2>/dev/null)
	if [ "0" = "$?" ]; then
		true
	else
		echo "JSH_JAVA_HOME not defined; should point to Java Development Kit."
		exit 1
	fi
else
	JSH_LAUNCHER_JRUNSCRIPT=$JSH_JAVA_HOME/bin/jrunscript
fi

if [ ! -f ${JSH_LAUNCHER_JRUNSCRIPT} ]; then
	>&2 echo "No jrunscript command found at ${JSH_LAUNCHER_JRUNSCRIPT}."
	exit 1
fi

if [ -f "$(dirname $0)/lib/nashorn.jar" ]; then
	LIB="$(dirname $0)/lib"
	# @notdry nashorn-dependencies
	JSH_JVM_OPTIONS="-classpath ${LIB}/asm.jar:${LIB}/asm-commons.jar:${LIB}/asm-tree.jar:${LIB}/asm-util.jar:${LIB}/nashorn.jar ${JSH_JVM_OPTIONS}"
fi

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

"$JSH_LAUNCHER_JRUNSCRIPT" $JSH_JVM_OPTIONS $JSH_LAUNCHER "$@"
exit $?
