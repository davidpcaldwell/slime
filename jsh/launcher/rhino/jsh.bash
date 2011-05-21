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

JSH_JAR=$(dirname $0)/jsh.jar
if [ -f "$JSH_JAR" ]; then
	JSH_LAUNCHER=$JSH_JAR
elif [ -n "$JSH_LAUNCHER_CLASSPATH" ]; then
	echo "DEPRECATED: launching via JSH_LAUNCHER_CLASSPATH: $JSH_LAUNCHER_CLASSPATH"
	true
else
	echo "Missing $JSH_JAR and \$JSH_LAUNCHER_CLASSPATH"
	exit 1
fi

case "`uname`" in
	CYGWIN*)
		if [ -n "$JSH_LAUNCHER" ]; then
			JSH_LAUNCHER=$(cygpath -wp $JSH_LAUNCHER)
		fi
		if [ -n "$JSH_LAUNCHER_CLASSPATH" ]; then
			JSH_LAUNCHER_CLASSPATH=$(cygpath -wp $JSH_LAUNCHER_CLASSPATH)
		fi
	;;
esac

if [ -z "$JSH_LAUNCHER_CLASSPATH" ]; then
	LAUNCHER_ARGS="-jar $JSH_LAUNCHER"
else
	LAUNCHER_ARGS="-classpath $JSH_LAUNCHER_CLASSPATH inonit.script.jsh.launcher.Main"
fi

$JSH_JAVA_HOME/bin/java $LAUNCHER_ARGS "$@"
exit $?
