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
