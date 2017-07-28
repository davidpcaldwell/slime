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

. $(dirname $0)/rc.bash
UNAME=$(uname)
JDK8_UPDATE=144
VERSION=1.8.0_$JDK8_UPDATE
RELEASE=8u$JDK8_UPDATE
if [ "$UNAME" = "Darwin" ]; then
	JAVA_DMG_NAME="JDK 8 Update $JDK8_UPDATE"
	JAVA_DMG_INSTALLER="$JAVA_DMG_NAME/$JAVA_DMG_NAME.pkg"
	JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk${VERSION}.jdk/Contents/Home
	JAVA_DMG_FILENAME=jdk-${RELEASE}-macosx-x64.dmg
	JAVA_DMG_URL=http://bitbucket.org/davidpcaldwell/slime/downloads/$JAVA_DMG_FILENAME
	if [ ! -d "$JAVA_HOME" ]; then
		function jdk_install() {
			hdiutil attach $1 >/dev/null
			open "/Volumes/$JAVA_DMG_INSTALLER"
		}
		distribution_install Java $JAVA_DMG_FILENAME $JAVA_DMG_URL jdk_install
	fi
elif [ "$UNAME" = "Linux" ]; then
	#	The below would be 180$JDK8_UPDATE for pre-1xx updates, so probably need to do string length or something for the future
	MAGNITUDE=18$JDK8_UPDATE
	JAVA_TARBALL_FILENAME="jdk-${RELEASE}-linux-x64.tar.gz"
	JAVA_TARBALL_URL=https://bitbucket.org/davidpcaldwell/slime/downloads/$JAVA_TARBALL_FILENAME
	JAVA_DESTINATION=/usr/lib/jvm/jdk$VERSION
	if [ ! -d $JAVA_DESTINATION ]; then
		if [ -f /mnt/host/downloads/${JAVA_TARBALL_FILENAME} ]; then
			LOCAL_TARBALL=/mnt/host/downloads/${JAVA_TARBALL_FILENAME}
		else
			wget -O $HOME/Downloads/${JAVA_TARBALL_FILENAME} $JAVA_TARBALL_URL
			LOCAL_TARBALL=$HOME/Downloads/${JAVA_TARBALL_FILENAME}
		fi
		if [ ! -f /tmp/$(basename $LOCAL_TARBALL) ]; then
			cp $LOCAL_TARBALL /tmp
		fi
		NAME=$(basename $LOCAL_TARBALL)
		TAR="/tmp/${NAME%.gz}"
		if [ ! -f "$TAR" ]; then
			gunzip /tmp/$NAME
			chmod +x $TAR
		fi
		if [ ! -d "/tmp/jdk$VERSION" ]; then
			tar xvf "/tmp/${NAME%.gz}" -C /tmp
		fi
		if [ ! -d "/usr/lib/jvm/jdk$VERSION" ]; then
			sudo mv /tmp/jdk$VERSION /usr/lib/jvm/jdk$VERSION
		fi
		sudo update-alternatives --install /usr/bin/java java /usr/lib/jvm/jdk$VERSION/jre/bin/java $MAGNITUDE
		sudo update-alternatives --install /usr/bin/jrunscript jrunscript /usr/lib/jvm/jdk$VERSION/bin/jrunscript $MAGNITUDE
		sudo update-alternatives --install /usr/bin/jar jar /usr/lib/jvm/jdk$VERSION/bin/jar $MAGNITUDE
		sudo update-alternatives --install /usr/bin/jjs jjs /usr/lib/jvm/jdk$VERSION/bin/jjs $MAGNITUDE
		sudo update-alternatives --install /usr/bin/jps jps /usr/lib/jvm/jdk$VERSION/bin/jps $MAGNITUDE
	fi
fi
