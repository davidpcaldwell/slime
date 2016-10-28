//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		"mysql:server": jsh.file.Pathname,
		"mysql:jdbc": jsh.file.Pathname,
		view: "console"
	}
});

var loader = new jsh.file.Loader({ directory: jsh.script.file.parent.parent });

if (parameters.options["mysql:jdbc"]) {
	jsh.loader.java.add(parameters.options["mysql:jdbc"]);
}

var module = (function() {
	if (jsh.shell.java.home.getSubdirectory("db")) {
		jsh.loader.java.add(jsh.shell.java.home.getRelativePath("db/lib/derby.jar"));
	} else if (jsh.shell.java.home.getRelativePath("../db")) {
		jsh.loader.java.add(jsh.shell.java.home.getRelativePath("../db/lib/derby.jar"));
	}
	var context = new function() {
		this.getJavaClass = function(name) {
			return jsh.java.getClass(name);
		}

		this.api = {
			js: jsh.js,
			java: jsh.java,
			io: jsh.io,
			debug: jsh.debug
		};
	};
	return loader.module("module.js", context);
})();

var suite = new jsh.unit.Suite({
	parts: {
		derby: new jsh.unit.part.Html({
			pathname: jsh.script.file.parent.parent.getRelativePath("derby/api.html"),
			environment: {
				module: module.derby
			}
		})
	}
});

if (parameters.options["mysql:server"]) {
	var MYSQL = parameters.options["mysql:server"].directory;
	var DATA = jsh.shell.TMPDIR.createTemporary({ directory: true });
	var PID = jsh.shell.TMPDIR.createTemporary();

	if (true) {
		jsh.shell.run({
			command: MYSQL.getFile("scripts/mysql_install_db"),
			arguments: [
				"--basedir=" + MYSQL.pathname,
				"--datadir=" + DATA.pathname
			]
		});
	} else {
		//	TODO	this is MySQL 5.7 version
		jsh.shell.run({
			command: MYSQL.getFile("bin/mysqld"),
			arguments: [
				"--initialize-insecure",
				"--datadir=" + DATA.pathname
			]
		});
	}
	jsh.shell.console("MySQL database initialized.");

	var port = jsh.ip.tcp.getEphemeralPortNumber();

	var server;
	var started = new jsh.java.Thread.Monitor();

	jsh.shell.console("Starting mysqld ...");
	jsh.java.Thread.start(function() {
		var myserver;

		jsh.shell.run({
			command: MYSQL.getFile("bin/mysqld"),
			arguments: [
				"--datadir=" + DATA.pathname,
				"--port=" + port,
				"--lc-messages-dir=" + MYSQL.getRelativePath("share/english")
			],
			on: {
				start: function(process) {
					myserver = process;
				}
			},
			stdio: {
				error: {
					line: function(string) {
						jsh.shell.console("[mysql stderr] " + string);
						if (/ready for connections/.test(string)) {
							new started.Waiter({
								until: function() {
									return true;
								},
								then: function() {
									server = myserver;
								}
							})()
						}
					}
				}
			}
		});
		jsh.shell.console("mysqld apparently terminated.");
		server = null;
	});

	jsh.shell.console("Started mysqld thread.");
	new started.Waiter({
		until: function() {
			return server;
		},
		then: function() {
		}
	})();
	jsh.shell.console("mysqld start detected.");

	Packages.java.lang.Runtime.getRuntime().addShutdownHook(
		new JavaAdapter(
			Packages.java.lang.Thread,
			{
				run: function() {
					if (server) {
						jsh.shell.console("Stopping mysqld ...");
						server.kill();
						jsh.shell.console("Stopped mysqld.");
					} else {
						jsh.shell.console("mysqld not running.");
					}
				}
			}
		)
	);

	if (parameters.options["mysql:jdbc"]) {
		suite.part("mysql", new jsh.unit.part.Html({
			pathname: jsh.script.file.parent.parent.getRelativePath("mysql/api.html"),
			environment: {
				module: module.mysql,
				mysql: {
					host: "127.0.0.1",
					port: port,
					user: "root",
					password: null
				}
			}
		}));
	}
}

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
