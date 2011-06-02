#	LICENSE
#	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
#	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
#	
#	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
#	express or implied. See the License for the specific language governing rights and limitations under the License.
#	
#	The Original Code is the jsh JavaScript/Java shell.
#	
#	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
#	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
#	
#	Contributor(s):
#	END LICENSE

if [ -n "$JSH_LAUNCHER_DEBUG" ]; then
	set -x
fi

if [ -z "$JSH_JAVA_HOME" ]; then
	echo "JSH_JAVA_HOME not defined; should point to Java 2 SDK."
	exit 1
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

$JSH_JAVA_HOME/bin/java -jar $JSH_LAUNCHER "$@"
exit $?
