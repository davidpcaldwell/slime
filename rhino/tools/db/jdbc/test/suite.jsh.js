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
		"postgresql:user": String,
		"postgresql:password": String,
		"postgresql:admin:user": String,
		"postgresql:admin:password": String,
		view: "console"
	}
});

var loader = new jsh.file.Loader({ directory: jsh.script.file.parent.parent });

if (parameters.options["mysql:jdbc"]) {
	jsh.loader.java.add(parameters.options["mysql:jdbc"]);
}

jsh.loader.plugins(jsh.script.file.parent.parent.pathname);
var module = jsh.db.jdbc;

var suite = new jsh.unit.html.Suite();

if (jsh.db.jdbc.postgresql) {
	suite.add("postgresql", new jsh.unit.html.Part({
		pathname: jsh.script.file.parent.parent.getRelativePath("postgresql/api.html"),
		environment: {
			server: {
				user: parameters.options["postgresql:user"],
				password: parameters.options["postgresql:password"],
				admin: {
					user: parameters.options["postgresql:admin:user"],
					password: parameters.options["postgresql:admin:password"]
				}
			}
		}
	}));
}

if (jsh.db.jdbc.derby) {
	suite.add("derby", new jsh.unit.html.Part({
		pathname: jsh.script.file.parent.parent.getRelativePath("derby/api.html"),
		environment: {
			module: module.derby
		}
	}));
}

if (parameters.options["mysql:server"]) {
	throw new Error("Convert to new HTML test suite.");
	//	TODO	switch to use mysql/server.js
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

	jsh.java.addShutdownHook(function() {
		if (server) {
			jsh.shell.console("Stopping mysqld ...");
			server.kill();
			jsh.shell.console("Stopped mysqld.");
		} else {
			jsh.shell.console("mysqld not running.");
		}
	});

	if (parameters.options["mysql:jdbc"]) {
		suite.part("mysql", new jsh.unit.html.Part({
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

jsh.unit.html.cli({
	suite: suite,
	part: parameters.options.part,
	view: parameters.options.view
});
