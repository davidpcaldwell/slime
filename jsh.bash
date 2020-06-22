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

#	Manual test case:
#	rm -Rvf local/jdk/default; rm -Rvf ~/.slime/jdk/default; ./jsh.bash jsh/test/jsh-data.jsh.js; ./jsh.bash --install-user-jdk; rm -Rvf local/jdk/default; ./jsh.bash jsh/test/jsh-data.jsh.js
#	check java.home of last script invoked and ensure that it is the user JDK

if [ "$0" == "bash" ]; then
	#	Remote shell
	#	set -x
	JDK_LOCAL="$(mktemp -d)"
	rmdir ${JDK_LOCAL}
	JDK_USER=/dev/null
	JSH_LAUNCHER_GITHUB_PROTOCOL="${JSH_LAUNCHER_GITHUB_PROTOCOL:-https}"
else
	JDK_LOCAL="$(dirname $0)/local/jdk/default"
	JDK_USER="${JSH_USER_JDK:-${HOME}/.slime/jdk/default}"
fi

announce_install() {
	URL="$1"
	DESTINATION="$2"
	#	TODO	possibly want to expand DESTINATION to absolute path for this message
	>&2 echo "Installing ${URL} to ${DESTINATION} ..."
}

download_install() {
	URL="$1"
	LOCATION="$2"
	if [ ! -f "${LOCATION}" ]; then
		echo "Downloading ${URL} ..."
		curl -L -o ${LOCATION} ${URL}
	fi
}

install_jdk_8_adoptopenjdk() {
	TO="$1"
	mkdir -p $(dirname ${TO})

	JDK_TARBALL_URL="https://github.com/AdoptOpenJDK/openjdk8-binaries/releases/download/jdk8u232-b09/OpenJDK8U-jdk_x64_mac_hotspot_8u232b09.tar.gz"
	JDK_TARBALL_BASENAME="OpenJDK8U-jdk_x64_mac_hotspot_8u232b09.tar.gz"
	JDK_TARBALL_LOCATION="${HOME}/Downloads/${JDK_TARBALL_BASENAME}"
	JDK_TARBALL_PATH="jdk8u232-b09"

	announce_install "${JDK_TARBALL_URL}" "${TO}"

	if [ ! -f "${JDK_TARBALL_LOCATION}" ]; then
		echo "Downloading ${JDK_TARBALL_URL} ..."
		curl -L -o ${HOME}/Downloads/${JDK_TARBALL_BASENAME} ${JDK_TARBALL_URL}
	fi
	JDK_WORKDIR=$(mktemp -d)
	tar xvf ${JDK_TARBALL_LOCATION} -C ${JDK_WORKDIR}
	mv ${JDK_WORKDIR}/${JDK_TARBALL_PATH} ${TO}
}

install_jdk_8_liberica() {
	TO="$1"
	mkdir -p $(dirname $TO)

	JDK_ZIP_URL="https://download.bell-sw.com/java/8u232+10/bellsoft-jdk8u232+10-macos-amd64.zip"
	JDK_ZIP_BASENAME="bellsoft-jdk8u232+10-macos-amd64.zip"
	JDK_ZIP_PATH="jdk8u232"
	JDK_ZIP_LOCATION="${HOME}/Downloads/${JDK_ZIP_BASENAME}"

	announce_install "${JDK_ZIP_URL}" "${TO}"
	download_install "${JDK_ZIP_URL}" "${JDK_ZIP_LOCATION}"

	JDK_WORKDIR=$(mktemp -d)
	unzip -q ${JDK_ZIP_LOCATION} -d ${JDK_WORKDIR}
	mv ${JDK_WORKDIR}/${JDK_ZIP_PATH} ${TO}
}

install_jdk_11_liberica() {
	TO="$1"
	mkdir -p $(dirname $TO)
	JDK_ZIP_URL="https://download.bell-sw.com/java/11.0.7+10/bellsoft-jdk11.0.7+10-macos-amd64.zip"
	JDK_ZIP_BASENAME="bellsoft-jdk11.0.7+10-macos-amd64.zip"
	JDK_ZIP_PATH="jdk-11.0.7.jdk"
	JDK_ZIP_LOCATION="${HOME}/Downloads/${JDK_ZIP_BASENAME}"
	if [ ! -f "${JDK_ZIP_LOCATION}" ]; then
		echo "Downloading ${JDK_ZIP_URL} ..."
		curl -o ${HOME}/Downloads/${JDK_ZIP_BASENAME} ${JDK_ZIP_URL}
	fi
	JDK_WORKDIR=$(mktemp -d)
	unzip -q ${JDK_ZIP_LOCATION} -d ${JDK_WORKDIR}
	mv ${JDK_WORKDIR}/${JDK_ZIP_PATH} ${TO}
}

install_jdk_8_corretto() {
	TO="$1"
	mkdir -p $(dirname ${TO})
	JDK_TARBALL_URL="https://corretto.aws/downloads/resources/8.252.09.1/amazon-corretto-8.252.09.1-macosx-x64.tar.gz"
	JDK_TARBALL_BASENAME="amazon-corretto-8.252.09.1-macosx-x64.tar.gz"
	JDK_TARBALL_LOCATION="${HOME}/Downloads/${JDK_TARBALL_BASENAME}"
	JDK_TARBALL_PATH="amazon-corretto-8.jdk/Contents/Home"
	if [ ! -f "${JDK_TARBALL_LOCATION}" ]; then
		echo "Downloading ${JDK_TARBALL_URL} ..."
		curl -L -o ${HOME}/Downloads/${JDK_TARBALL_BASENAME} ${JDK_TARBALL_URL}
	fi
	JDK_WORKDIR=$(mktemp -d)
	tar xvf ${JDK_TARBALL_LOCATION} -C ${JDK_WORKDIR}
	mv ${JDK_WORKDIR}/${JDK_TARBALL_PATH} ${TO}
}

install_jdk_11_corretto() {
	TO="$1"
	mkdir -p $(dirname ${TO})
	JDK_TARBALL_URL="https://corretto.aws/downloads/resources/11.0.7.10.1-1/amazon-corretto-11.0.7.10.1-1-macosx-x64.tar.gz"
	JDK_TARBALL_BASENAME="amazon-corretto-11.0.7.10.1-1-macosx-x64.tar.gz"
	JDK_TARBALL_LOCATION="${HOME}/Downloads/${JDK_TARBALL_BASENAME}"
	JDK_TARBALL_PATH="amazon-corretto-11.jdk/Contents/Home"
	if [ ! -f "${JDK_TARBALL_LOCATION}" ]; then
		echo "Downloading ${JDK_TARBALL_URL} ..."
		curl -L -o ${HOME}/Downloads/${JDK_TARBALL_BASENAME} ${JDK_TARBALL_URL}
	fi
	JDK_WORKDIR=$(mktemp -d)
	tar xvf ${JDK_TARBALL_LOCATION} -C ${JDK_WORKDIR}
	mv ${JDK_WORKDIR}/${JDK_TARBALL_PATH} ${TO}
}

install_jdk_8() {
	install_jdk_8_corretto "$@"
}

install_jdk_11() {
	install_jdk_11_corretto "$@"
}

install_jdk() {
	install_jdk_8 "$@"
}

if [ "$1" == "--install-jdk" ]; then
	install_jdk ${JDK_LOCAL}
	exit $?
fi

if [ "$1" == "--install-jdk-11" ]; then
	install_jdk_11 ${JDK_LOCAL}
	exit $?
fi

if [ "$1" == "--add-jdk-8" ]; then
	install_jdk_8 $(dirname $0)/local/jdk/8
	exit $?
fi

if [ "$1" == "--add-jdk-11" ]; then
	install_jdk_11 $(dirname $0)/local/jdk/11
	exit $?
fi

if [ "$1" == "--install-user-jdk" ]; then
	install_jdk ${JDK_USER}
	exit $?
fi

check_jdk() {
	AT="$1"
	if [ -f "$AT/bin/jrunscript" ]; then
		return 0
	else
		return 1
	fi
}

#	TODO	the below would not support adoptopenjdk8 on Mac OS X; need to use Contents/Home

check_environment() {
	if [ -n "${JSH_LAUNCHER_JDK_HOME}" ]; then
		check_jdk ${JSH_LAUNCHER_JDK_HOME}
		if [ $? -eq 0 ]; then
			echo "${JSH_LAUNCHER_JDK_HOME}/bin/jrunscript"
		fi
	fi
}

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

JRUNSCRIPT=$(check_environment)

if [ -z "${JRUNSCRIPT}" ]; then
	JRUNSCRIPT=$(check_local)
fi

if [ -z "${JRUNSCRIPT}" ]; then
	JRUNSCRIPT=$(check_user)
fi

if [ -z "${JRUNSCRIPT}" ]; then
	JRUNSCRIPT=$(check_path)
fi

if [ -z "${JRUNSCRIPT}" ]; then
	install_default_jdk ${JDK_LOCAL}
	JRUNSCRIPT="${JDK_LOCAL}/bin/jrunscript"
fi

#	TODO	Because jsh shells invoke jrunscript by name currently, we put jrunscript in the PATH. Could be removed by having
#			shells execute subshells using the launcher program (e.g., this bash script), or by having it locate jrunscript
#			dynamically, possibly using an environment variable provided here
export PATH="$(dirname ${JRUNSCRIPT}):${PATH}"

javaSystemPropertyArgument() {
	if [ -n "$2" ]; then
		echo "-D$1=$2"
	fi
}

PROXY_HOST_ARGUMENT=$(javaSystemPropertyArgument http.proxyHost ${JSH_HTTP_PROXY_HOST})
PROXY_PORT_ARGUMENT=$(javaSystemPropertyArgument http.proxyPort ${JSH_HTTP_PROXY_PORT})
JSH_GITHUB_USER_ARGUMENT=$(javaSystemPropertyArgument jsh.github.user ${JSH_GITHUB_USER})
JSH_GITHUB_PASSWORD_ARGUMENT=$(javaSystemPropertyArgument jsh.github.password ${JSH_GITHUB_PASSWORD})

get_jdk_major_version() {
	#	This function works with supported JDKs Amazon Corretto 8 and 11. Untested with others.
	JDK=$1
	JAVA="${JDK}/bin/java"
	IFS=$'\n'
	JAVA_VERSION_OUTPUT=$(${JAVA} -version 2>&1)
	for line in ${JAVA_VERSION_OUTPUT}; do
		if [[ $line =~ \"(.+)\" ]]; then
			JAVA_VERSION="${BASH_REMATCH[1]}"
		fi
	done
	if [ -n ${JAVA_VERSION} ]; then
		if [[ $JAVA_VERSION =~ ^1\.8\. ]]; then
			echo "8"
		elif [[ $JAVA_VERSION =~ ^11\. ]]; then
			echo "11"
		else
			echo "Unknown"
		fi
	else
		echo "Unparsed"
	fi
}

#	So this is a mess. With JDK 11 and up, according to (for example) https://bugs.openjdk.java.net/browse/JDK-8210140, we need
#	an extra argument to Nashorn (--no-deprecation-warning) to avoid emitting warnings. But this argument causes Nashorn not to
#	be found with JDK 8. So we have to version-check the JDK to determine whether to supply the argument. This version test works
#	with SLIME-supported Amazon Corretta JDK 8 and JDK 11, and hasn't yet been tested with anything else.
#
#	But it works with JDK 8 and 11, so it's better than nothing.
JDK_MAJOR_VERSION=$(get_jdk_major_version $(dirname ${JRUNSCRIPT})/..)
if [ "${JDK_MAJOR_VERSION}" == "11" ]; then
	export JSH_NASHORN_DEPRECATION_ARGUMENT="-Dnashorn.args=--no-deprecation-warning"
	JRUNSCRIPT="${JRUNSCRIPT} ${JSH_NASHORN_DEPRECATION_ARGUMENT}"
fi

if [ "$0" == "bash" ]; then
	JSH_NETWORK_ARGUMENTS="${PROXY_HOST_ARGUMENT} ${PROXY_PORT_ARGUMENT} ${JSH_GITHUB_USER_ARGUMENT} ${JSH_GITHUB_PASSWORD_ARGUMENT}"
	${JRUNSCRIPT} ${JSH_NETWORK_ARGUMENTS} -e "load('${JSH_LAUNCHER_GITHUB_PROTOCOL}://raw.githubusercontent.com/davidpcaldwell/slime/master/rhino/jrunscript/api.js?jsh')" "$@"
else
	${JRUNSCRIPT} $(dirname $0)/rhino/jrunscript/api.js jsh "$@"
fi