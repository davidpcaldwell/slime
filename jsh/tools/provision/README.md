[comment]: # (	LICENSE)
[comment]: # (	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not)
[comment]: # (	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.)
[comment]: # ()
[comment]: # ()
[comment]: # (	The Original Code is the jsh JavaScript/Java shell.)
[comment]: # ()
[comment]: # (	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.)
[comment]: # (	Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.)
[comment]: # ()
[comment]: # (	Contributor(s):)
[comment]: # (	END LICENSE)

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

#	Recommended structure

The following describes one way to structure a provisioning implementation that uses Bitbucket as the host.

##	install.jsh.js

The top-level `install.jsh.js` can be used as the value for `INONIT_PROVISION_SCRIPT_JSH`.

###	Install Mercurial

It should first install Mercurial, so that the repository code can be cloned from Bitbucket:

```
jsh.tools.install.hg.install();
```

###	Clone the repository

Under most circumstances, it should also provide a destination to which to clone the code, by default, along with an environment
variable that allows the script to clone the code to a different place.

The following snippet clones the code in *repository*, owned by Bitbucket user *user*, to `$HOME/src/local` unless the
`INONIT_PROVISION_DESTINATION` environment variable is provided; in that case, the code is cloned to the location specified by that.

```
var destination = (jsh.shell.environment.INONIT_PROVISION_DESTINATION) ? jsh.file.Pathname(jsh.shell.environment.INONIT_PROVISION_DESTINATION) : jsh.shell.HOME.getRelativePath("src/local");
jsh.tools.provision.clone({
	destination: destination,
	user: "user",
	repository: "repository"
});
```

###	Run a setup script from the repository

```
jsh.shell.run({
	command: "bash",
	arguments: [
		destination.directory.getRelativePath("setup.bash")
	]
});
```

##	setup.bash

The `setup.bash` script can simply specify a `jsh` script that does the local setup, and a `jsh` shell to execute it. For example,
if the shell is located at `setup/slime`, and the script is at `setup/main.jsh.js`, the following code can be used:

```
BASE=$(dirname $0)
jrunscript $BASE/setup/slime/rhino/jrunscript/api.js jsh $BASE/setup/main.jsh.js "$@"
```

##	setup/main.jsh.js

The `setup/main.jsh.js` script should, under most circumstances, begin by installing Rhino and Tomcat into the shell if they are not
already present. Rhino is used as the primary `jsh` interpreter, and Tomcat is used for the creation of local applications (and
thus may be needed for an installer). If either needs to be installed, the shell should re-launch with the two libraries included.

The following sample code implements the above:

```
jsh.shell.console("Verifying jsh libraries (Rhino/Tomcat) ...");
var relaunch = false;
jsh.tools.install.rhino.install({}, {
	installed: function(e) {
		relaunch = true;
	}
});
jsh.tools.install.tomcat.install({}, {
	installed: function(e) {
		relaunch = true;
	}
});

if (relaunch) {
	jsh.shell.console("Relaunching with Rhino/Tomcat in shell ...");
	jsh.shell.jsh({
		script: jsh.script.file,
		arguments: [],
		evaluate: function(result) {
			jsh.shell.exit(result.status);
		}
	});
}
```

The setup script can then proceed with arbitrary code, knowing that both Rhino and Tomcat are available.

##	Post-installation

The `jdk.bash` script can be executed by itself in order to conditionally upgrade Java. It will exit with a status of 1 if a GUI
installation is needed. In that case, the caller should print a message like "Then re-execute the installation command." This
message will make sense when used in context of the output of the script itself. In the above structure, most likely `jdk.bash`
would be executed from `setup.bash` or `setup/main.jsh.js`.

This mechanism can be used from `jsh` by loading the `jsh.tools.provision` plugin and executing `jsh.tools.provision.jdk()`.
