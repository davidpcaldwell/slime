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
JSH_SLIME_SRC=$(dirname $0)/../../../..
cd $JSH_SLIME_SRC

CYGPATH=$(which cygpath)
if [ -z "$CYGPATH" ]; then
	CYGPATH=echo
else
	CYGPATH="cygpath -w"
fi

$JAVA_COMMAND -jar $(${CYGPATH} ${JSH_RHINO_HOME}/js.jar) -f jsh/launcher/rhino/api.rhino.js jsh/launcher/rhino/test/unbuilt.rhino.js "$@"
