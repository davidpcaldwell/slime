<!--
LICENSE
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.


The Original Code is the jsh JavaScript/Java shell.

The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.

Contributor(s):
END LICENSE
-->
#	Role of the provisioner

The provisioner is designed to be executed remotely, and to bootstrap the execution of a remote `jsh` script. `jsh` scripts can also
be executed remotely, but `jrunscript` is required to be installed locally in order to launch them. Thus, the provisioner checks
whether the desired version of the Java Development Kit (JDK) is installed, and if it is not, installs it before executing the
remote `jsh` script.

On OS X, since the JDK has a GUI installer, when Java is not present, the provisioner launches the JDK installer and exits. After
installing Java, a second run of the provisioner will run the remote `jsh` script.

#	Using the provisioner

##	Sample command (unprotected remote script)

For a remote script hosted at a reachable URL, a single command can be used to launch the script. The provisioner must be provided
the URL of the remote script as the `INONIT_PROVISION_SCRIPT_JSH` environment variable. Here is a sample command that runs a test
script from the provisioner repository.

	curl -s -L https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/tip/jsh/tools/provision/remote.bash | env  INONIT_PROVISION_SCRIPT_JSH=https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/tip/jsh/tools/provision/test/application.jsh.js bash

##	Sample command (protected remote script)

The provisioner also supports scripts that are protected by HTTP basic authentication. In order to use such a script, the
`INONIT_PROVISION_USER` environment variable must be defined as the user name; this will trigger the remote script to prompt for
the password. Because the password will be read by the script from standard input, the remote provisioner must be written to
a temporary file and then executed from there (which makes the command somewhat longer). (Note that this sample command will not
work without modification; the repository is private.)

	(export TMP_INSTALLER=$(mktemp);
	export INONIT_PROVISION_SCRIPT_JSH=https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime-kit/raw/tip/test/provision-script.jsh.js;
	export INONIT_PROVISION_USER=davidpcaldwell;
	curl -s -L -o $TMP_INSTALLER https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/tip/jsh/tools/provision/remote.bash;
	chmod +x $TMP_INSTALLER;
	$TMP_INSTALLER)

##	Configuring the provisioner

Other environment variables affect the behavior of the provisioner. For unprotected remote scripts these can be supplied to the
shell; for protected remote scripts, they can be supplied along with the other environment values.

*	`INONIT_PROVISION_VERSION`=[commit, tag or bookmark] (defaults to `tip`)
