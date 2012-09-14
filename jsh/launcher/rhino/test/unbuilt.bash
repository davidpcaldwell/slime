#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	The Original Code is the jsh JavaScript/Java shell.
#
#	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
#	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
#
#	Contributor(s):
#	END LICENSE

set -x

if [ -z "$JSH_JAVA_HOME" ]; then
	JSH_JAVA_HOME="$JAVA_HOME"
fi

if [ -z "$JSH_JAVA_HOME" ]; then
	JAVA_COMMAND=$(which java)
	if [ -z "$JAVA_COMMAND" ]; then
		echo "Cannot locate Java: please set \$JSH_JAVA_HOME, \$JAVA_HOME, or put the Java launcher in your PATH."
		exit 1
	fi
else
	JAVA_COMMAND=$JSH_JAVA_HOME/bin/java
fi

if [ -z "$JSH_RHINO_HOME" ]; then
	echo "Cannot locate Rhino: please specify \$JSH_RHINO_HOME"
	exit 1
fi
export JSH_SLIME_SRC=$(dirname $0)/../../../..

CYGPATH=$(which cygpath)
if [ -z "$CYGPATH" ]; then
	CYGPATH=echo
else
	CYGPATH="cygpath -w"
fi

LAUNCHER_COMMAND="$JAVA_COMMAND -jar $(${CYGPATH} ${JSH_RHINO_HOME}/js.jar)"
#LAUNCHER_COMMAND="$JAVA_COMMAND -classpath $(${CYGPATH} ${JSH_RHINO_HOME}/js.jar) org.mozilla.javascript.tools.debugger.Main"
$LAUNCHER_COMMAND -f $(${CYGPATH} $JSH_SLIME_SRC/jsh/launcher/rhino/api.rhino.js) $(${CYGPATH} $JSH_SLIME_SRC/jsh/launcher/rhino/test/unbuilt.rhino.js) "$@"
