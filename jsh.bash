#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

#	Manual test case:
#	rm -Rvf local/jdk/default; rm -Rvf ~/.slime/jdk/default; ./jsh.bash jsh/test/jsh-data.jsh.js; ./jsh.bash --install-user-jdk; rm -Rvf local/jdk/default; ./jsh.bash jsh/test/jsh-data.jsh.js
#	check java.home of last script invoked and ensure that it is the user JDK

if [ -n "${JSH_LAUNCHER_BASH_DEBUG}" ]; then
	set -x
fi

UNAME=$(uname)

if [ "$0" == "bash" ]; then
	#	Remote shell
	#	set -x
	JSH_LOCAL_JDKS="$(mktemp -d)"
	rmdir ${JSH_LOCAL_JDKS}
	JDK_USER_JDKS=/dev/null
	JSH_LAUNCHER_GITHUB_PROTOCOL="${JSH_LAUNCHER_GITHUB_PROTOCOL:-https}"
else
	JSH_LOCAL_JDKS="${JSH_LOCAL_JDKS:-$(dirname $0)/local/jdk}"
	JDK_USER_JDKS="${JSH_USER_JDKS:-${HOME}/.slime/jdk}"
fi

clean_destination() {
	TO="$1"
	if [ -d "${TO}" ]; then
		>&2 echo "Removing existing installation at ${TO} ..."
		rm -Rf "${TO}"
	fi
	mkdir -p $(dirname ${TO})
	echo "${TO}"
}

announce_install() {
	URL="$1"
	DESTINATION="$2"
	#	TODO	possibly want to expand DESTINATION to absolute path for this message
	>&2 echo "Installing ${URL} to ${DESTINATION} ..."
}

APT_UPDATED=
debian_install_package() {
	local SUDO=""
	local sudo="$(which sudo)"
	if [ ${sudo} ]; then
		SUDO="${sudo}"
	fi
	local package="$1"
	if [ "$(which apt-get)" ]; then
		if [ -z "${APT_UPDATED}" ]; then
			${SUDO} apt-get update
			${SUDO} apt-get upgrade
			APT_UPDATED=true
		fi
		${SUDO} apt-get -y install $package
	else
		exit 1
	fi
}

download_install() {
	URL="$1"
	LOCATION="$2"
	if [ ! -f "${LOCATION}" ]; then
		>&2 echo "Downloading ${URL} ..."
		if [ "${UNAME}" == "Darwin" ]; then
			curl -L -o ${LOCATION} ${URL}
		elif [ "${UNAME}" == "Linux" ]; then
			if [ ! "$(which wget)" ]; then
				debian_install_package wget
			fi
			wget -O ${LOCATION} ${URL}
		fi
	fi
}

install_jdk_8_adoptopenjdk() {
	TO=$(clean_destination $1)

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
	TO=$(clean_destination $1)

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
	TO=$(clean_destination $1)

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
	TO=$(clean_destination $1)

	local VERSION="8.282.08.1"
	if [ "${UNAME}" == "Darwin" ]; then
		JDK_TARBALL_BASENAME="amazon-corretto-${VERSION}-macosx-x64.tar.gz"
		JDK_TARBALL_PATH="amazon-corretto-8.jdk/Contents/Home"
	elif [ "${UNAME}" == "Linux" ]; then
		JDK_TARBALL_BASENAME="amazon-corretto-${VERSION}-linux-x64.tar.gz"
		JDK_TARBALL_PATH="amazon-corretto-${VERSION}-linux-x64"
	fi
	JDK_TARBALL_URL="https://corretto.aws/downloads/resources/${VERSION}/${JDK_TARBALL_BASENAME}"
	if [ ! -d "${HOME}/Downloads" ]; then
		mkdir "${HOME}/Downloads"
	fi
	JDK_TARBALL_LOCATION="${HOME}/Downloads/${JDK_TARBALL_BASENAME}"

	if [ ! -f "${JDK_TARBALL_LOCATION}" ]; then
		download_install "${JDK_TARBALL_URL}" "${JDK_TARBALL_LOCATION}"
	fi
	JDK_WORKDIR=$(mktemp -d)
	tar xf ${JDK_TARBALL_LOCATION} -C ${JDK_WORKDIR}
	local TAR_EXIT_CODE="$?"
	if [ "${TAR_EXIT_CODE}" -ne 0 ]; then
		exit ${TAR_EXIT_CODE}
	fi
	mv ${JDK_WORKDIR}/${JDK_TARBALL_PATH} ${TO}
	>&2 echo "Installed ${JDK_TARBALL_URL} at ${TO}"
}

install_jdk_11_corretto() {
	TO=$(clean_destination $1)

	JDK_TARBALL_URL="https://corretto.aws/downloads/resources/11.0.9.12.1/amazon-corretto-11.0.9.12.1-macosx-x64.tar.gz"
	JDK_TARBALL_BASENAME="amazon-corretto-11.0.9.12.1-macosx-x64.tar.gz"
	JDK_TARBALL_LOCATION="${HOME}/Downloads/${JDK_TARBALL_BASENAME}"
	JDK_TARBALL_PATH="amazon-corretto-11.jdk/Contents/Home"
	if [ ! -f "${JDK_TARBALL_LOCATION}" ]; then
		echo "Downloading ${JDK_TARBALL_URL} ..."
		curl -L -o ${HOME}/Downloads/${JDK_TARBALL_BASENAME} ${JDK_TARBALL_URL}
	fi
	JDK_WORKDIR=$(mktemp -d)
	tar xf ${JDK_TARBALL_LOCATION} -C ${JDK_WORKDIR}
	mv ${JDK_WORKDIR}/${JDK_TARBALL_PATH} ${TO}
	>&2 echo "Installed ${JDK_TARBALL_URL} at ${TO}"
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
	install_jdk ${JSH_LOCAL_JDKS}/default
	exit $?
fi

if [ "$1" == "--install-jdk-11" ]; then
	install_jdk_11 ${JSH_LOCAL_JDKS}/default
	exit $?
fi

if [ "$1" == "--add-jdk-8" ]; then
	install_jdk_8 ${JSH_LOCAL_JDKS}/8
	exit $?
fi

if [ "$1" == "--add-jdk-11" ]; then
	install_jdk_11 ${JSH_LOCAL_JDKS}/11
	exit $?
fi

if [ "$1" == "--install-user-jdk" ]; then
	install_jdk ${JDK_USER_JDKS}/default
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
	check_jdk ${JSH_LOCAL_JDKS}/default
	if [ $? -eq 0 ]; then
		echo "${JSH_LOCAL_JDKS}/default/bin/jrunscript"
	fi
}

#	TODO	provide a way to install to this directory

check_user() {
	check_jdk ${JDK_USER_JDKS}/default
	if [ $? -eq 0 ]; then
		echo "${JDK_USER_JDKS}/default/bin/jrunscript"
	fi
}

check_path() {
	local path=$(type -p jrunscript)
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
	install_jdk ${JSH_LOCAL_JDKS}/default
	JRUNSCRIPT="${JSH_LOCAL_JDKS}/default/bin/jrunscript"
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

HTTP_PROXY_HOST_ARGUMENT=$(javaSystemPropertyArgument http.proxyHost ${JSH_HTTP_PROXY_HOST})
HTTP_PROXY_PORT_ARGUMENT=$(javaSystemPropertyArgument http.proxyPort ${JSH_HTTP_PROXY_PORT})
HTTPS_PROXY_HOST_ARGUMENT=$(javaSystemPropertyArgument https.proxyHost ${JSH_HTTPS_PROXY_HOST})
HTTPS_PROXY_PORT_ARGUMENT=$(javaSystemPropertyArgument https.proxyPort ${JSH_HTTPS_PROXY_PORT})
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
	#	TODO	below is an attempt to get this working with a private GitHub repository. There are many problems with this:
	#			*	can't use the standard java.net.Authenticator because GitHub uses 404 rather than 401 when unauthorized
	#			*	need to delve into sun.* classes to try to manipulate cached authentication data. May still be possible in
	#				principle, but possibly more effort than it is worth given that repository will eventually be public.
	#			If repository is made public, this may be removed; authorize.js can probably be removed.
	get_authorization_script() {
		SCRIPT=$1
		if [ -n "${JSH_HTTP_PROXY_HOST}" ]; then
			CURL_PROXY_ARGUMENTS="-x ${JSH_LAUNCHER_GITHUB_PROTOCOL}://${JSH_HTTP_PROXY_HOST}:${JSH_HTTP_PROXY_PORT}"
		fi
		if [ -n "${JSH_HTTPS_PROXY_HOST}" ]; then
			CURL_PROXY_ARGUMENTS="${CURL_PROXY_ARGUMENTS} -x ${JSH_LAUNCHER_GITHUB_PROTOCOL}://${JSH_HTTPS_PROXY_HOST}:${JSH_HTTPS_PROXY_PORT}"
		fi
		AUTHORIZATION_SCRIPT_URL="${JSH_LAUNCHER_GITHUB_PROTOCOL}://raw.githubusercontent.com/davidpcaldwell/slime/master/rhino/tools/github/${SCRIPT}"
		echo $(curl -L ${CURL_PROXY_ARGUMENTS} -u ${JSH_GITHUB_USER}:${JSH_GITHUB_PASSWORD} ${AUTHORIZATION_SCRIPT_URL})
	}

	JSH_NETWORK_ARGUMENTS="${HTTP_PROXY_HOST_ARGUMENT} ${HTTP_PROXY_PORT_ARGUMENT} ${HTTPS_PROXY_HOST_ARGUMENT} ${HTTPS_PROXY_PORT_ARGUMENT} ${JSH_GITHUB_USER_ARGUMENT} ${JSH_GITHUB_PASSWORD_ARGUMENT}"
	#	AUTHORIZATION_SCRIPT=$(get_authorization_script authorize.js)
	#	echo ${AUTHORIZATION_SCRIPT}
	AUTHORIZATION_SCRIPT="//  no-op"
	${JRUNSCRIPT} ${JSH_NETWORK_ARGUMENTS} -e "${AUTHORIZATION_SCRIPT}" -e "load('${JSH_LAUNCHER_GITHUB_PROTOCOL}://raw.githubusercontent.com/davidpcaldwell/slime/master/rhino/jrunscript/api.js?jsh')" "$@"
else
	${JRUNSCRIPT} $(dirname $0)/rhino/jrunscript/api.js jsh "$@"
fi
