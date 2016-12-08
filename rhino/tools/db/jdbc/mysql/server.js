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

$exports.Server = function(o) {
//	var SOCKET = jsh.file.Pathname("/tmp/mysql.sock");
//
//	var process;
//	var started = false;
//	var lock = new jsh.java.Thread.Monitor();
//
//	this.start = function(p) {
//		if (SOCKET.file) throw new Error("MySQL already running; " + SOCKET + " found.");
//
//		jsh.java.Thread.start(function() {
//			var args = [];
//			for (var x in o.options) {
//				args.push("--" + x + "=" + o.options[x]);
//			}
//			jsh.shell.run({
//				command: o.install.getFile("bin/mysqld"),
//				arguments: args,
//				on: {
//					start: function(o) {
//						process = o;
//					}
//				}
//			});
//		});
//
//		jsh.java.Thread.start(function() {
//			while(!SOCKET.file) {
//				try {
//					Packages.java.lang.Thread.currentThread().sleep(100);
//				} catch (e) {
//				}
//			}
//			started = true;
//		});
//
//		new lock.Waiter({
//			until: function() {
//				return started;
//			},
//			then: function() {
//			}
//		})();
//	};
//
//	this.stop = function(p) {
//		if (!process) throw new Error("MySQL server not started.");
//		process.kill();
//		process = null;
//	}

	if (!o) o = {};
	if (!o.data) o.data = o.base.getRelativePath("data");

	this.initialize = function() {
		if (true) {
			jsh.shell.run({
				command: o.base.getFile("scripts/mysql_install_db"),
				arguments: [
					"--basedir=" + o.base.pathname,
					"--datadir=" + o.data
				]
			});
		} else {
			//	TODO	this is MySQL 5.7 version
			jsh.shell.run({
				command: o.base.getFile("bin/mysqld"),
				arguments: [
					"--initialize-insecure",
					"--datadir=" + o.data
				]
			});
		}
		jsh.shell.console("MySQL database initialized.");
	};

	var server;

	this.start = function(p) {
		var started = new jsh.java.Thread.Monitor();

		jsh.shell.console("Starting mysqld ...");
		jsh.java.Thread.start(function() {
			var myserver;

			jsh.shell.run({
				command: o.base.getFile("bin/mysqld"),
				arguments: [
					"--datadir=" + o.data,
					"--port=" + o.port,
					"--lc-messages-dir=" + o.base.getRelativePath("share/english")
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
	};

	this.stop = function(p) {
		if (server) {
			jsh.shell.console("Stopping mysqld ...");
			server.kill();
			jsh.shell.console("Stopped mysqld.");
			server = null;
		} else {
			jsh.shell.console("mysqld not running.");
		}
	};

//	TODO	 is this needed?
//	var object = this;
//
//	Packages.java.lang.Runtime.getRuntime().addShutdownHook(
//		new JavaAdapter(
//			Packages.java.lang.Thread,
//			{
//				run: function() {
//					object.stop();
//				}
//			}
//		)
//	);
}