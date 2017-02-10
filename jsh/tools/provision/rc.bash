#	LICENSE
#	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
#	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
#
#	The Original Code is the jsh JavaScript/Java shell.
#
#	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
#	Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.
#
#	Contributor(s):
#	END LICENSE

function create_host_mount() {
	if [ ! -d /mnt ]; then
		sudo mkdir /mnt
	fi

	if [ ! -h /mnt/host ]; then
		sudo ln -s "$1" /mnt/host
	fi
}

VMWARE="/Volumes/VMware Shared Folders"
if [ -d "$VMWARE" ]; then
	create_host_mount "$VMWARE"
fi

function distribution_install() {
	DISTRIBUTION_NAME=$1
	DISTRIBUTION_FILENAME=$2
	DISTRIBUTION_URL=$3
	DISTRIBUTION_INSTALL_COMMAND=$4
	if [ -f "$HOME/Downloads/$DISTRIBUTION_FILENAME" ]; then
		LOCAL_DISTRIBUTION="$HOME/Downloads/$DISTRIBUTION_FILENAME"
	elif [ -f "/mnt/host/downloads/$DISTRIBUTION_NAME" ]; then
		LOCAL_DISTRIBUTION="/mnt/host/downloads/$DISTRIBUTION_FILENAME"
	else
		curl -f -s -L -o "$HOME/Downloads/$DISTRIBUTION_FILENAME" "$DISTRIBUTION_URL"
		if [ "$?" -ne "0" ]; then
			>&2 echo "Failed to download $DISTRIBUTION_URL"
			exit 1
		fi
		LOCAL_DISTRIBUTION="$HOME/Downloads/$DISTRIBUTION_FILENAME"
	fi
	#	TODO	would be nice if the below step blocked until installation were complete, but it does not. If I try to simply
	#			execute the given path, it fails with "cannot execute binary file"
	echo "Install $DISTRIBUTION_NAME before continuing." >&2
	"$DISTRIBUTION_INSTALL_COMMAND" "$LOCAL_DISTRIBUTION"
	exit 1
}
