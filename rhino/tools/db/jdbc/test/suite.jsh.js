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

var blob = function(schema,test) {
	var table = schema.getTable({ name: "DATA" });
	test(table != null);
	var bytes = [0,1,2,3,4,5,6,7,8,9];
	var _array = jsh.java.Array.create({
		type: Packages.java.lang.Byte.TYPE,
		array: bytes.map(function(js) {
			return new Packages.java.lang.Byte(js);
		})
	});
	var stream = jsh.io.java.adapt(new Packages.java.io.ByteArrayInputStream(_array));

	var inserted = false;
	schema.perform(function(context) {
		table.insert({
			a: 1,
			b: stream
		});
		inserted = true;
	});
	test(inserted);

	var completed = false;
	schema.perform(function(context) {
		var rows = context.createQuery({ sql: "SELECT * FROM DATA" }).toArray();
		test(rows.length == 1);
		test(rows[0].a == 1);
		if (rows[0].a) {
			//	TODO	add test for reading inserted blob
			var _bytes = new Packages.inonit.script.runtime.io.Streams().readBytes(rows[0].b.java.adapt());
			for (var i=0; i<_bytes.length; i++) {
				test(_bytes[i] == bytes[i]);
			}
		} else {
			test(false);
		}
		completed = true;
	});
	test(completed);
};

var suite = new jsh.unit.Suite({
	parts: {
		derby: new jsh.unit.part.Html({
			pathname: jsh.script.file.parent.parent.getRelativePath("derby/api.html"),
			environment: {
				module: module.derby,
				blob: blob
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

//	var count = 0;
//	while(!PID.file && server !== null) {
//		jsh.shell.console("Checking for PID at " + PID);
//		count++;
//		Packages.java.lang.Thread.sleep(500);
//		if (count >= 900 * 1000 / 500) {
//			throw new Error("Did not start");
//		}
//	}

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
				},
				blob: blob
			}
		}));
	}
}

jsh.unit.interface.create(suite, {
	view: parameters.options.view
});
