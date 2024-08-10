#!/bin/bash
#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

#	This script emulates the user experience of installing Java into a shell. See https://github.com/davidpcaldwell/slime/issues/73
BASE=$(dirname $0)/../../../..
if [ -d "${BASE}/local/jdk" ]; then
	>&2 echo "Removing local JDKs ..."
	rm -Rf local/jdk
fi
if [ -f "${HOME}/Downloads/amazon-corretto-8.282.08.1-macosx-x64.tar.gz" ]; then
	>&2 echo "Removing installer so that JDK will be downloaded ..."
	rm "${HOME}/Downloads/amazon-corretto-8.282.08.1-macosx-x64.tar.gz"
fi
>&2 echo "Running shell, ignoring user JDKs ..."
export JSH_USER_JDKS=/dev/null
"${BASE}/jsh" "${BASE}/jsh/test/jsh-data.jsh.js"
