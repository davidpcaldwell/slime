//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var globals = jsh.script.getopts({
			unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
		});

		var command = globals.arguments.shift();

		var tomcat = new jsh.httpd.Tomcat({
		});

		var commands = new function() {
			var map = function() {
				var script = jsh.script.script.getRelativePath("../../../rhino/http/servlet/test/hello.servlet.js").file;
				tomcat.map({
					path: "/",
					servlets: {
						"/*": {
							file: script
						}
					}
				});
			}

			this.start = function() {
				var parameters = jsh.script.getopts({
					options: {
						nomap: false
					}
				}, arguments);

				if (!parameters.options.nomap) {
					map();
				}

				tomcat.start();
				jsh.shell.echo("Started.");
			};

			var stop = function(delay) {
				return function() {
					jsh.shell.echo("Stopping in " + delay + " milliseconds.");
					Packages.java.lang.Thread.currentThread().sleep(delay);
					jsh.shell.echo("Stopping ...");
					tomcat.stop();
					jsh.shell.echo("Stopped.");
				}
			}

			//	TODO	running run -stop 10000 causes JDBC driver deregistration to fail.

			this.run = function() {
				var parameters = jsh.script.getopts({
					options: {
						stop: Number
					}
				})

				map();
				tomcat.start();
				if (parameters.options.stop) {
					jsh.java.Thread.start({ call: stop(parameters.options.stop) });
				}
				jsh.shell.echo("Running ...");
				tomcat.run();
				jsh.shell.echo("Ran.");
			}
		}

		eval("commands." + command).apply(commands,globals.arguments);
	}
)();
