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
