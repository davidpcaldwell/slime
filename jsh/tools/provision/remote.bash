#!/bin/bash
if [ -n "$INONIT_PROVISION_DEBUG" ]; then
	set -x
fi
#	http_proxy if applicable
#	INONIT_PROVISION_USER if applicable
#	INONIT_PROVISION_VERSION if not tip
#	INONIT_SLIME_VERSION if jsh needed and not tip

if [ -z "$INONIT_PROVISION_VERSION" ]; then
	INONIT_PROVISION_VERSION=tip
fi

REMOTE_PROVISION=$(mktemp -d 2>/dev/null || mktemp -d -t inonit-provision)

download() {
	curl -s -L -o $REMOTE_PROVISION/$1 http://bitbucket.org/davidpcaldwell/slime/raw/$INONIT_PROVISION_VERSION/jsh/tools/provision/$1
	chmod +x $REMOTE_PROVISION/$1
}

download bootstrap.bash
download rc.bash
download jdk.bash

$REMOTE_PROVISION/jdk.bash

if [ "$?" == "1" ]; then
	#	If the bootstrap.bash script returns 1, the calling script should immediately exit with status 0
	>&2 echo "Then re-execute the installation command."
	#	TODO	ideally we would not re-download the provisioning code, but to make it all work we would likely have to output
	#			a command pointing to this (presumably-now-local) script and providing all the environment variables provided
	#			on the command line (including the value created for REMOTE_PROVISION); easier to ask the user to press up-arrow
	#			and then ENTER.
	exit 0
else
	if [ -n "$INONIT_PROVISION_DEBUG" ]; then
		>&2 echo "Found prerequisites; continuing."
	fi
fi

if [ -n "$INONIT_PROVISION_USER" ]; then
	read -s -p "Bitbucket password:" INONIT_PROVISION_PASSWORD;
	>&2 echo ""
	export INONIT_PROVISION_PASSWORD;
	USER_ARGUMENT="-u $INONIT_PROVISION_USER:$INONIT_PROVISION_PASSWORD"
fi

jsh() {
	PROXY_HOST=$(echo $http_proxy | sed 's/http:\/\/\(.*\):.*/\1/')
	PROXY_PORT=$(echo $http_proxy | sed 's/http:\/\/.*:\(.*\)/\1/' | tr -d "/")
	jrunscript -Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Djsh.loader.user=$INONIT_PROVISION_USER -Djsh.loader.password=$INONIT_PROVISION_PASSWORD -e "load('http://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/$INONIT_PROVISION_VERSION/rhino/jrunscript/api.js?jsh')" "$@"
}

if [ -n "$INONIT_PROVISION_SCRIPT_BASH" ]; then
	REMOTE_INSTALLER=$(mktemp);
	curl -s -L $USER_ARGUMENT -o $REMOTE_INSTALLER $INONIT_PROVISION_INSTALLER; 
	chmod +x $REMOTE_INSTALLER
	export jsh
	. $REMOTE_INSTALLER
elif [ -n "$INONIT_PROVISION_SCRIPT_JSH" ]; then
	jsh "$INONIT_PROVISION_SCRIPT_JSH"
else
	>&2 echo "Required: \$INONIT_PROVISION_SCRIPT_BASH or \$INONIT_PROVISION_SCRIPT_JSH"
	exit 1
fi

