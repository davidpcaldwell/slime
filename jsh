#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#	END LICENSE

#	Manual test case:
#	rm -Rvf local/jdk/default; rm -Rvf ~/.slime/jdk/default; ./jsh jsh/test/jsh-data.jsh.js; ./jsh --install-user-jdk; rm -Rvf local/jdk/default; ./jsh jsh/test/jsh-data.jsh.js
#	check java.home of last script invoked and ensure that it is the user JDK

if [ -n "${JSH_LAUNCHER_BASH_DEBUG}" ]; then
	set -x
fi

UNAME=$(uname)
ARCH=$(arch)

if test -z "$0:-"; then
	>&2 echo "\$0 not set; exiting."
	exit 1
elif test "$0" == "bash"; then
	#	Remote shell
	#	set -x
	JSH_LOCAL_JDKS="$(mktemp -d)"
	rmdir ${JSH_LOCAL_JDKS}
	JDK_USER_JDKS=/dev/null
	JSH_SHELL_LIB="$(mktemp -d)"
	JSH_LAUNCHER_GITHUB_PROTOCOL="${JSH_LAUNCHER_GITHUB_PROTOCOL:-https}"
	JSH_LAUNCHER_GITHUB_BRANCH="${JSH_LAUNCHER_GITHUB_BRANCH:-main}"
else
	JSH_LOCAL_JDKS="${JSH_LOCAL_JDKS:-$(dirname $0)/local/jdk}"
	JDK_USER_JDKS="${JSH_USER_JDKS:-${HOME}/.slime/jdk}"
	JSH_SHELL_LIB="${JSH_SHELL_LIB:-$(dirname $0)/local/jsh/lib}"
fi

#	In preparation for installing software at a given location, remove whatever is there
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
			${SUDO} apt-get -y update
			${SUDO} apt-get -y upgrade
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
			mkdir -p "$(dirname $LOCATION)" 2>/dev/null
			curl -L -o ${LOCATION} ${URL}
		elif [ "${UNAME}" == "Linux" ]; then
			if [ ! "$(which wget)" ]; then
				debian_install_package wget
			fi
			mkdir -p "$(dirname $LOCATION)" 2>/dev/null
			wget -O ${LOCATION} ${URL}
		fi
	fi
}

#	Returns the major version of a JDK (including GraalVM) given its full version number
get_major_version_from_jdk_version() {
	local VERSION="$1"
	local MAJOR=$(echo $VERSION | cut -d'.' -f1)
	echo ${MAJOR}
}

install_jdk_corretto() {
	local VERSION="$1"
	local MAJOR_VERSION=$(get_major_version_from_jdk_version ${VERSION})
	TO=$(clean_destination "$2")

	if [ "${UNAME}" == "Darwin" ]; then
		if [ "${ARCH}" == "arm64" ]; then
			JDK_TARBALL_BASENAME="amazon-corretto-${VERSION}-macosx-aarch64.tar.gz"
		else
			#	i386
			JDK_TARBALL_BASENAME="amazon-corretto-${VERSION}-macosx-x64.tar.gz"
		fi
		JDK_TARBALL_PATH="amazon-corretto-${MAJOR_VERSION}.jdk/Contents/Home"
	elif [ "${UNAME}" == "Linux" ]; then
		if [ "${ARCH}" == "aarch64" ]; then
			JDK_TARBALL_BASENAME="amazon-corretto-${VERSION}-linux-aarch64.tar.gz"
			JDK_TARBALL_PATH="amazon-corretto-${VERSION}-linux-aarch64"
		else
			JDK_TARBALL_BASENAME="amazon-corretto-${VERSION}-linux-x64.tar.gz"
			JDK_TARBALL_PATH="amazon-corretto-${VERSION}-linux-x64"
		fi
	fi
	JDK_TARBALL_URL="https://corretto.aws/downloads/resources/${VERSION}/${JDK_TARBALL_BASENAME}"

	announce_install "${JDK_TARBALL_URL}" "${TO}"

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

install_graalvm() {
	local VERSION="$1"
	local TO=$(clean_destination "$2")
	local MAJOR=$(get_major_version_from_jdk_version ${VERSION})
	local JDK_TARBALL_URL=""
	#	See https://www.oracle.com/java/technologies/downloads/archive/#GraalVM for information about versions
	if [ "${UNAME}" == "Darwin" ]; then
		JDK_TARBALL_URL="https://download.oracle.com/graalvm/${MAJOR}/archive/graalvm-jdk-${VERSION}_macos-${ARCH}_bin.tar.gz"
	elif [ "${UNAME}" == "Linux" ]; then
		JDK_TARBALL_URL="https://download.oracle.com/graalvm/${MAJOR}/archive/graalvm-jdk-${VERSION}_linux-${ARCH}_bin.tar.gz"
	fi
	if [ -z "${JDK_TARBALL_URL}" ]; then
		>&2 echo "Unsupported OS/architecture: ${UNAME} ${ARCH}"
		exit 1
	fi

	announce_install "${JDK_TARBALL_URL}" "${TO}"

	local JDK_TARBALL_BASENAME="$(echo $JDK_TARBALL_URL | cut -d'/' -f7)"
	if [ ! -d "${HOME}/Downloads" ]; then
		mkdir "${HOME}/Downloads"
	fi
	local JDK_TARBALL_LOCATION="${HOME}/Downloads/${JDK_TARBALL_BASENAME}"
	if [ ! -f "${JDK_TARBALL_LOCATION}" ]; then
		download_install "${JDK_TARBALL_URL}" "${JDK_TARBALL_LOCATION}"
	fi
	local JDK_WORKDIR=$(mktemp -d)
	tar xf ${JDK_TARBALL_LOCATION} -C ${JDK_WORKDIR}
	local TAR_EXIT_CODE="$?"
	if [ "${TAR_EXIT_CODE}" -ne 0 ]; then
		exit ${TAR_EXIT_CODE}
	fi
	local JDK_TARBALL_PATH="$(ls ${JDK_WORKDIR})"
	if [ "${UNAME}" == "Darwin" ]; then
		JDK_TARBALL_PATH="${JDK_TARBALL_PATH}/Contents/Home"
	fi
	mv ${JDK_WORKDIR}/${JDK_TARBALL_PATH} ${TO}
	>&2 echo "Installed ${JDK_TARBALL_URL} at ${TO}"
}

install_jdk_8_corretto() {
	install_jdk_corretto "8.412.08.1" $1
}

install_jdk_11_corretto() {
	install_jdk_corretto "11.0.23.9.1" $1
}

install_jdk_17_corretto() {
	install_jdk_corretto "17.0.11.9.1" $1
}

install_jdk_21_corretto() {
	install_jdk_corretto "21.0.3.9.1" $1
}

install_jdk_8() {
	install_jdk_8_corretto "$@"
}

install_jdk_11() {
	install_jdk_11_corretto "$@"
}

install_jdk_17() {
	install_jdk_17_corretto "$@"
}

install_jdk_21() {
	install_jdk_21_corretto "$@"
}

install_jdk() {
	install_jdk_21 "$@"
}


#	Possible basis for supporting Rhino as bootstrap engine via JSR-223
#	JSH_BOOTSTRAP_RHINO="${JSH_SHELL_LIB}/js.jar"
JSH_BOOTSTRAP_NASHORN="${JSH_SHELL_LIB}/nashorn.jar"
# @notdry nashorn-dependencies
JSH_BOOTSTRAP_NASHORN_LIBRARIES_GROUP=org.ow2.asm
JSH_BOOTSTRAP_NASHORN_LIBRARIES_ARTIFACTS="asm asm-commons asm-tree asm-util"
JSH_BOOTSTRAP_NASHORN_LIBRARIES_VERSION=7.3.1

get_maven_dependency() {
	GROUP=$1
	ARTIFACT=$2
	VERSION=$3
	GROUP_PREFIX="$(echo $GROUP | tr . /)"
	echo "https://repo1.maven.org/maven2/${GROUP_PREFIX}/${ARTIFACT}/${VERSION}/${ARTIFACT}-${VERSION}.jar"
}

install_maven_dependency() {
	download_install $(get_maven_dependency $1 $2 $3) $4
}

get_bootstrap_nashorn_classpath() {
	rv=""
	local WAS_IFS=${IFS}
	IFS=" "
	set -- ${JSH_BOOTSTRAP_NASHORN_LIBRARIES_ARTIFACTS}
	for name in "$@"; do
		if [ -n "${rv}" ]; then
			rv="${rv}:"
		fi
		rv="${rv}${JSH_SHELL_LIB}/${name}.jar"
	done
	IFS="${WAS_IFS}"
	echo ${rv}
}

install_nashorn() {
	local WAS_IFS=${IFS}

	IFS=" "
	set -- ${JSH_BOOTSTRAP_NASHORN_LIBRARIES_ARTIFACTS}

	#	Derived from https://repo1.maven.org/maven2/org/openjdk/nashorn/nashorn-core/15.6/nashorn-core-15.6.pom
	for name in "$@"; do
		install_maven_dependency \
			${JSH_BOOTSTRAP_NASHORN_LIBRARIES_GROUP} \
			${name} \
			${JSH_BOOTSTRAP_NASHORN_LIBRARIES_VERSION} \
			${JSH_SHELL_LIB}/${name}.jar
	done
	IFS="${WAS_IFS}"

	NASHORN_VERSION=15.6
	install_maven_dependency org.openjdk.nashorn nashorn-core ${NASHORN_VERSION} ${JSH_SHELL_LIB}/nashorn.jar
}

get_jrunscript_java_major_version() {
	#	It would be more straightforward to just do jrunscript -e "print(Packages.java.lang.System.getProperty('java.version'))"
	#	and then parse that. But with Nashorn 11, there's deprecation output, and with 17/21, there's no Nashorn so you can't
	#	execute the script. So we fall back to Java and hope our jrunscript is installed normally, rather than in /usr/bin or
	#	something

	#	TODO	logic duplicated in jsh/launcher/main.js; can it somehow be invoked from here? Would be a pain.
	#	This function works with supported JDKs Amazon Corretto 8 and 11. Untested with others.
	JRUNSCRIPT=$1
	JDK=$(dirname $JRUNSCRIPT)/..
	JAVA="${JDK}/bin/java"
	IFS=$'\n'
	JAVA_VERSION_OUTPUT=$(${JAVA} -version 2>&1)
	local JAVA_VERSION=$(echo $JAVA_VERSION_OUTPUT | awk -F'"' '/version/ {print $2}')
	if test -n "${JAVA_VERSION}"; then
		case "${JAVA_VERSION}" in
			1.8.*) echo "8" ;;
			11.*) echo "11" ;;
			17.*) echo "17" ;;
			21.*) echo "21" ;;
			*) echo "Unknown" ;;
		esac
	else
		echo "Unparsed"
	fi
}

if [ "$1" == "--install-jdk" ]; then
	#	Default JDK remains 8 because remote shell does not yet work with JDK 11; module path issues
	#	See jrunscript/jsh/test/remote.fifty.ts
	install_jdk ${JSH_LOCAL_JDKS}/default
	exit $?
fi

if [ "$1" == "--install-jdk-8" ]; then
	install_jdk_8 ${JSH_LOCAL_JDKS}/default
	exit $?
fi

if [ "$1" == "--install-jdk-11" ]; then
	install_jdk_11 ${JSH_LOCAL_JDKS}/default
	exit $?
fi

if [ "$1" == "--install-jdk-17" ]; then
	install_jdk_17 ${JSH_LOCAL_JDKS}/default
	exit $?
fi

if [ "$1" == "--install-jdk-21" ]; then
	install_jdk_21 ${JSH_LOCAL_JDKS}/default
	exit $?
fi

if [ "$1" == "--install-graalvm" ]; then
	install_graalvm "21.0.7" ${JSH_SHELL_LIB}/graal
	GRAAL_POLYGLOT_LIB="${JSH_SHELL_LIB}/graal/lib/polyglot"
	GRAALJS_VERSION="23.1.7"
	#	TODO	what if this directory exists? Clear it?
	mkdir ${GRAAL_POLYGLOT_LIB}

	#	This list of dependencies was derived by:
	#	* Creating a minimal Maven project
	#	* Running mvnw package
	#	* Adding dependencies for polyglot and GraalJS
	#	* Running mvnw package again and capturing the log
	#	* Determining what was downloaded by searching the log for JARS
	#
	#	TODO	An automated solution could be considered; we could either write a program to emit this list and then copy and paste
	#			it into this script, or probably better, write a jsh script to do the whole thing (which could then be parameterized)
	#			and invoke it here.
	#
	#	We are dumping all of these to a single directory by themselves, so the jsh
	#	launcher can simply list them and add them to the classpath or modulepath

	install_maven_dependency org.graalvm.polyglot polyglot ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/polyglot.jar
	install_maven_dependency org.graalvm.sdk collections ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/collections.jar
	install_maven_dependency org.graalvm.sdk word ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/word.jar
	install_maven_dependency org.graalvm.sdk nativeimage ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/nativeimage.jar
	install_maven_dependency org.graalvm.truffle truffle-api ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/truffle-api.jar
	install_maven_dependency org.graalvm.truffle truffle-enterprise ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/truffle-enterprise.jar
	install_maven_dependency org.graalvm.truffle truffle-compiler ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/truffle-compiler.jar
	install_maven_dependency org.graalvm.sdk jniutils ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/jniutils.jar
	install_maven_dependency org.graalvm.sdk nativebridge ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/nativebridge.jar
	install_maven_dependency org.graalvm.regex regex ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/regex.jar
	install_maven_dependency org.graalvm.truffle truffle-runtime ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/truffle-runtime.jar

	install_maven_dependency org.graalvm.js js-language ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/js-language.jar
	install_maven_dependency org.graalvm.shadowed icu4j ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/icu4j.jar

	#	Note that although the documentation explicitly states these are not required --
	#	https://www.graalvm.org/latest/tools/chrome-debugger/ says (in contract to when launching with OpenJDK):
	#	"The Chrome Inspector tool is always available as a tool on GraalVM. No dependency needs to be explicitly declared there,"
	#	testing indicates these absolutely are required.

	install_maven_dependency org.graalvm.shadowed json ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/json.jar
	install_maven_dependency org.graalvm.tools profiler-tool ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/profiler-tool.jar
	install_maven_dependency org.graalvm.tools chromeinspector-tool ${GRAALJS_VERSION} ${GRAAL_POLYGLOT_LIB}/chromeinspector-tool.jar
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

if [ "$1" == "--add-jdk-17" ]; then
	install_jdk_17 ${JSH_LOCAL_JDKS}/17
	exit $?
fi

if [ "$1" == "--add-jdk-21" ]; then
	install_jdk_21 ${JSH_LOCAL_JDKS}/21
	exit $?
fi

if [ "$1" == "--install-user-jdk" ]; then
	install_jdk ${JDK_USER_JDKS}/default
	exit $?
fi

#	This capability was removed and to bring it back would require changes due to supporting multiple Rhino versions for Java
#	version compatibility
# if [ "$1" == "--install-rhino" ]; then
# 	install_rhino
# 	exit $?
# fi

if [ "$1" == "--test-jdk-major-version" ]; then
	echo $(get_jrunscript_java_major_version $2)
	exit $?
fi

if [ "$1" == "--test-get-maven-dependency" ]; then
	shift 1
	echo $(get_maven_dependency $@)
	exit $?
fi

if [ "$1" == "--test-bootstrap-nashorn-classpath" ]; then
	echo $(get_bootstrap_nashorn_classpath)
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
		#	Mac OS X uses a default stub for jrunscript; check whether there's a real JDK
		if test $(uname) == "Darwin" && test -n "${path}" && test "${path}" == "/usr/bin/jrunscript"; then
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

#	If running in remote shell, and JDK is higher than 8, do not use it (the remote shell module path does not work correctly; see
#	issue #1617)
if test -n "${JRUNSCRIPT}" && test "$0" == "bash"; then
	JDK_MAJOR_VERSION=$(get_jrunscript_java_major_version $(dirname ${JRUNSCRIPT})/..)
	if [ ${JDK_MAJOR_VERSION} != "8" ]; then
		JRUNSCRIPT=""
	fi
fi

if [ -z "${JRUNSCRIPT}" ]; then
	install_jdk ${JSH_LOCAL_JDKS}/default
	JRUNSCRIPT="${JSH_LOCAL_JDKS}/default/bin/jrunscript"
fi

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

#	So this is a mess. With JDK 11 and up, according to (for example) https://bugs.openjdk.java.net/browse/JDK-8210140, we need
#	an extra argument to Nashorn (--no-deprecation-warning) to avoid emitting warnings. But this argument causes Nashorn not to
#	be found with JDK 8. So we have to version-check the JDK to determine whether to supply the argument. This version test works
#	with SLIME-supported Amazon Corretto JDK 8, JDK 11, and JDK 17, and hasn't yet been tested with anything else.
#
#	But it works with JDK 8, 11, and 17, so it's better than nothing.
JDK_MAJOR_VERSION=$(get_jrunscript_java_major_version ${JRUNSCRIPT})
if [ "${JDK_MAJOR_VERSION}" == "11" ]; then
	export JSH_NASHORN_DEPRECATION_ARGUMENT="-Dnashorn.args=--no-deprecation-warning"
	JRUNSCRIPT="${JRUNSCRIPT} ${JSH_NASHORN_DEPRECATION_ARGUMENT}"
fi

if [ "${JDK_MAJOR_VERSION}" == "17" ] || [ "${JDK_MAJOR_VERSION}" == "21" ]; then
	#	Currently we know that we are not running a remote shell because we would download something other than Java 17 for that.
	if [ ! -f "${JSH_BOOTSTRAP_NASHORN}" ]; then
		install_nashorn
	fi
	# If JSR-223 Rhino worked with jrunscript ...
	# JRUNSCRIPT="${JRUNSCRIPT} -classpath ${JSH_BOOTSTRAP_RHINO}:${JSH_BOOTSTRAP_RHINO_ENGINE}"
	# BIN="$(dirname ${JRUNSCRIPT})"
	# JRUNSCRIPT="${BIN}/java -jar ${JSH_BOOTSTRAP_RHINO} -opt -1"
	JRUNSCRIPT="${JRUNSCRIPT} -classpath $(get_bootstrap_nashorn_classpath):${JSH_BOOTSTRAP_NASHORN}"
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
		AUTHORIZATION_SCRIPT_URL="${JSH_LAUNCHER_GITHUB_PROTOCOL}://raw.githubusercontent.com/davidpcaldwell/slime/${JSH_LAUNCHER_GITHUB_BRANCH}/rhino/tools/github/${SCRIPT}"
		echo $(curl -L ${CURL_PROXY_ARGUMENTS} -u ${JSH_GITHUB_USER}:${JSH_GITHUB_PASSWORD} ${AUTHORIZATION_SCRIPT_URL})
	}

	JSH_NETWORK_ARGUMENTS="${HTTP_PROXY_HOST_ARGUMENT} ${HTTP_PROXY_PORT_ARGUMENT} ${HTTPS_PROXY_HOST_ARGUMENT} ${HTTPS_PROXY_PORT_ARGUMENT} ${JSH_GITHUB_USER_ARGUMENT} ${JSH_GITHUB_PASSWORD_ARGUMENT}"
	#	AUTHORIZATION_SCRIPT=$(get_authorization_script authorize.js)
	#	echo ${AUTHORIZATION_SCRIPT}
	AUTHORIZATION_SCRIPT="//  no-op"
	export JSH_SHELL_LIB
	${JRUNSCRIPT} ${JSH_NETWORK_ARGUMENTS} -e "${AUTHORIZATION_SCRIPT}" -e "load('${JSH_LAUNCHER_GITHUB_PROTOCOL}://raw.githubusercontent.com/davidpcaldwell/slime/${JSH_LAUNCHER_GITHUB_BRANCH}/rhino/jrunscript/api.js?jsh')" "$@"
else
	${JRUNSCRIPT} "$(dirname $0)/rhino/jrunscript/api.js" jsh "$@"
fi
