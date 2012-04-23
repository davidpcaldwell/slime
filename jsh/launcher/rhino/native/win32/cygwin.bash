#!/bin/bash
#	TODO	consider converting to jsh script
if [ -z "$JAVA_HOME" ]; then
	echo "Required: \$JAVA_HOME"
	exit 1
fi
if [ -z "$LIB_TMP" ]; then
	echo "Required: \$LIB_TMP"
	exit 1
fi
if [ -z "$TO" ]; then
	echo "Required: \$TO"
	exit 1
fi
echo "Building input library to ${LIB_TMP} ..."
dlltool --input-def $(dirname $0)/jvm.def --kill-at --dllname jvm.dll --output-lib "${LIB_TMP}/libjvm.dll.a"
echo "Compiling launcher to ${TO} using JAVA_HOME ${JAVA_HOME} ..."
gcc -mno-cygwin -o "${TO}/jsh.exe" -I"${JAVA_HOME}/include" -I"${JAVA_HOME}/include/win32" -I/usr/include/w32api \
	$(dirname $0)/../jsh.c -L"${LIB_TMP}" -L/usr/lib/w32api -ljvm -lshlwapi
