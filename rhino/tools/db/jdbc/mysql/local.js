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

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.db.mysql.local.Context } $context
	 * @param { (value: slime.jrunscript.db.mysql.local.Exports) => void } $export
	 */
	function(Packages,JavaAdapter,$context,$export) {
		var jsh = $context.library;

		/** @type { slime.jrunscript.db.mysql.local.Exports["Client"] } */
		var Client = function(o) {
			var command = function(args) {
				return {
					command: o.program,
					arguments: args
				};
			};

			return {
				command: function(p) {
					var args = [];
					if (p.host) args.push("--host", p.host);
					if (p.port) args.push("--port", String(p.port));
					if (p.user) args.push("--user", p.user);
					if (p.execute) args.push("--execute", p.execute);
					return command(args);
				}
			};
		}

		/** @type { slime.jrunscript.db.mysql.local.Exports["Server"] } */
		var Server = function(o) {
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

			if (!o.port) o.port = 3306;
			if (!o.data) o.data = o.base.getRelativePath("data");

			var initialize = function() {
				var VERSION_UNDER_57 = false;
				if (VERSION_UNDER_57) {
					var command = o.base.getFile("scripts/mysql_install_db");
					if (!command) {
						throw new Error("No file at " + o.base.getRelativePath("scripts/mysql_install_db"));
					}
					jsh.shell.run({
						command: o.base.getFile("scripts/mysql_install_db"),
						arguments: [
							"--basedir=" + o.base.pathname,
							"--datadir=" + o.data
						]
					});
				} else {
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

			var start = function(p) {
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

			var stop = function(p) {
				if (server) {
					jsh.shell.console("Stopping mysqld ...");
					server.kill();
					jsh.shell.console("Stopped mysqld.");
					server = null;
				} else {
					jsh.shell.console("mysqld not running.");
				}
			};

			var rv = {
				initialize: initialize,
				start: start,
				stop: stop
			};

			//	Without this shutdown hook, forked server process will outlive VM
			Packages.java.lang.Runtime.getRuntime().addShutdownHook(
				new JavaAdapter(
					Packages.java.lang.Thread,
					{
						run: function() {
							rv.stop();
						}
					}
				)
			);

			return rv;
		}

		$export({
			Server: Server,
			Client: Client
		});
	}
//@ts-ignore
)(Packages,JavaAdapter,$context,$export);

