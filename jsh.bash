#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#
#	The Original Code is the SLIME project.
#
#	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
#	Portions created by the Initial Developer are Copyright (C) 2019 the Initial Developer. All Rights Reserved.
#
#	Contributor(s):
#	END LICENSE

SRC=$(dirname $0)

JDK_LOCAL="${SRC}/local/jdk/default"
JDK_USER="${HOME}/.slime/jdk/default"

URL_libericaopenjdk8="https://download.bell-sw.com/java/8u232+10/bellsoft-jdk8u232+10-macos-amd64.zip"

JDK_provider="libericaopenjdk8"

install_adoptopenjdk8() {
	TO="$1"
	mkdir -p $(dirname $TO)
	JDK_TARBALL_URL="https://github.com/AdoptOpenJDK/openjdk8-binaries/releases/download/jdk8u232-b09/OpenJDK8U-jdk_x64_mac_hotspot_8u232b09.tar.gz"
	JDK_TARBALL_BASENAME="OpenJDK8U-jdk_x64_mac_hotspot_8u232b09.tar.gz"
	JDK_TARBALL_LOCATION="$HOME/Downloads/$JDK_TARBALL_BASENAME"
	JDK_TARBALL_PATH="jdk8u232-b09"
	if [ ! -f "$JDK_TARBALL_LOCATION" ]; then
		echo "Downloading JDK ..."
		curl -L -o $HOME/Downloads/$JDK_TARBALL_BASENAME $JDK_TARBALL_URL
	fi
	JDK_WORKDIR=$(mktemp -d)
	tar xvf $JDK_TARBALL_LOCATION -C $JDK_WORKDIR
	mv $JDK_WORKDIR/$JDK_TARBALL_PATH $TO
	export JDK_BIN="${TO}/Contents/Home/bin"
}

install_libericaopenjdk8() {
	TO="$1"
	mkdir -p $(dirname $TO)
	JDK_ZIP_URL="${URL_libericaopenjdk8}"
	JDK_ZIP_BASENAME="bellsoft-jdk8u232+10-macos-amd64.zip"
	JDK_ZIP_PATH="jdk8u232"
	JDK_ZIP_LOCATION="$HOME/Downloads/$JDK_ZIP_BASENAME"
	if [ ! -f "$JDK_ZIP_LOCATION" ]; then
		echo "Downloading $JDK_ZIP_URL ..."
		curl -o $HOME/Downloads/$JDK_ZIP_BASENAME $JDK_ZIP_URL
	fi
	JDK_WORKDIR=$(mktemp -d)
	unzip -q $JDK_ZIP_LOCATION -d $JDK_WORKDIR
	mv $JDK_WORKDIR/$JDK_ZIP_PATH $TO
}

check_jdk() {
	AT="$1"
	if [ -f "$AT/bin/jrunscript" ]; then
		return 0
	else
		return 1
	fi
}

#	TODO	the below would not support adoptopenjdk8 on Mac OS X; need to use Contents/Home

check_local() {
	check_jdk ${JDK_LOCAL}
	if [ $? -eq 0 ]; then
		echo "${JDK_LOCAL}/bin/jrunscript"
	fi
}

#	TODO	provide a way to install to this directory

check_user() {
	check_jdk ${JDK_USER}
	if [ $? -eq 0 ]; then
		echo "${JDK_USER}/bin/jrunscript"
	fi
}

check_path() {
	local path=$(type jrunscript)
	if [ -n "${path}" ]; then
		if [ $(uname) == "Darwin" ]; then
			#	Mac OS X uses a default stub for jrunscript; check whether there's a real JDK
			local macos_java_home=$(/usr/libexec/java_home 2>/dev/null)
			if [ "${macos_java_home}" ]; then
				echo "${macos_java_home}/bin/jrunscript"
			fi
		else
			echo "${path}"
		fi
	fi
}

JRUNSCRIPT=$(check_local)

if [ -z "${JRUNSCRIPT}" ]; then
	JRUNSCRIPT=$(check_user)
fi

if [ -z "${JRUNSCRIPT}" ]; then
	JRUNSCRIPT=$(check_path)
fi

if [ -z "${JRUNSCRIPT}" ]; then
	URL_variable_name="URL_${JDK_provider}"
	URL="$(echo ${!URL_variable_name})"
	#	TODO	possibly want to expand JDK_LOCAL to absolute path for this message
	>&2 echo "Installing ${URL} to ${JDK_LOCAL} ..."
	install_${JDK_provider} ${JDK_LOCAL}
	JRUNSCRIPT=${JDK_LOCAL}/bin/jrunscript
fi

#	TODO	Because jsh shells invoke jrunscript by name currently, we put jrunscript in the PATH. Could be removed by having
#			shells execute subshells using the launcher program (e.g., this bash script), or by having it locate jrunscript
#			dynamically, possibly using an environment variable provided here
export PATH="$(dirname ${JRUNSCRIPT}):${PATH}"

${JRUNSCRIPT} $SRC/rhino/jrunscript/api.js jsh "$@"
