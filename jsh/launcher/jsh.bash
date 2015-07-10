#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	The Original Code is the jsh JavaScript/Java shell.
#
#	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
#	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
#
#	Contributor(s):
#	END LICENSE

if [ -n "$JSH_LAUNCHER_DEBUG" ]; then
	set -x
fi

if [ -z "$JSH_JAVA_HOME" ]; then
	JSH_JAVA_LAUNCHER=$(which java 2>/dev/null)
	if [ "0" = "$?" ]; then
		true
	else
		echo "JSH_JAVA_HOME not defined; should point to Java 2 SDK."
		exit 1
	fi
else
	JSH_JAVA_LAUNCHER=$JSH_JAVA_HOME/bin/java
fi

JSH_LAUNCHER=$(dirname $0)/jsh.jar
if [ ! -f "$JSH_LAUNCHER" ]; then
	echo "Missing jsh launcher at $JSH_LAUNCHER"
	exit 1
fi

case "`uname`" in
	CYGWIN*)
		JSH_LAUNCHER=$(cygpath -wp $JSH_LAUNCHER)
	;;
esac

"$JSH_JAVA_LAUNCHER" -jar $JSH_LAUNCHER "$@"
exit $?