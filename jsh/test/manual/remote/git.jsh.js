//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2018 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
	}
});

if (jsh.shell.jsh.url) {
	jsh.shell.console("jsh.tools.git = " + jsh.tools.git);
	jsh.shell.exit(0);
}

jsh.tools.provision.plugin.test();
var SLIME = jsh.script.file.parent.parent.parent.parent.parent;

var server;
var started;
var lock = new jsh.java.Thread.Monitor();

jsh.shell.console("Starting thread ...");
jsh.java.Thread.start(function() {
	try {
		//	TODO	should not need empty object
		server = new jsh.test.provision.Server({});
		server.start();
		new lock.Waiter({
			until: function() {
				return true;
			},
			then: function() {
				started = true;
				jsh.shell.console("Proceeding.");
			}
		})();
	} catch (e) {
		jsh.shell.console(e);
		jsh.shell.console(e.stack);
	}
});

jsh.shell.console("Waiting for server.");
lock.Waiter({
	until: function() {
		return started;
	},
	then: function() {
		jsh.shell.console("Server started.");
	}
})();

var environment = jsh.js.Object.set({}, jsh.shell.environment, server.environment, {
	INONIT_PROVISION_PROTOCOL: "http",
	INONIT_PROVISION_VERSION: "local",
	INONIT_PROVISION_SCRIPT_JSH: jsh.script.file.toString(),
	INONIT_PROVISION_DEBUG: "true"
});
jsh.shell.run({
	environment: environment,
	command: "bash",
	arguments: (function(rv) {
		rv.push(SLIME.getRelativePath("jsh/tools/provision/remote.bash"))
		return rv;
	})([]),
	evaluate: function(result) {
		jsh.shell.exit(result.status);
	}
});
//	TODO	how the heck do we run a remote shell? Need documentation
//jsh.shell.run({
//	command
//});
