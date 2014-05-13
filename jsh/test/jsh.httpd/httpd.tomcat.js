//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Tomcat = function(p) {
	this.home = p.home;

	this.Base = function(pp) {
		var base = (pp.base) ? pp.base : jsh.shell.TMPDIR.createTemporary({ directory: true });
		this.base = base;

		(function() {
			if (pp.configuration) {
				//	pp.configuration is file
				pp.configuration.copy(base.getRelativePath("conf/server.xml"), { recursive: true });
			}
			base.getRelativePath("logs").createDirectory({
				ifExists: function(dir) {
					return false;
				}
			});
			base.getRelativePath("temp").createDirectory({
				ifExists: function(dir) {
					return false;
				}
			});
			base.getRelativePath("webapps").createDirectory({
				ifExists: function(dir) {
					return false;
				}
			});
		})();

		var catalina = function(command,m) {
			return function() {
				return jsh.shell.shell({
					command: jsh.file.Pathname("/bin/sh").file,
					arguments: [
						p.home.getRelativePath("bin/catalina.sh"),
						command
					],
					environment: jsh.js.Object.set({}, jsh.shell.environment, {
						//	Strip trailing slashes from path names, which appear to confuse catalina.sh
						//	TODO	see if it works without the stripping
						CATALINA_BASE: base.toString().substring(0,base.toString().length-1),
						CATALINA_HOME: p.home.toString().substring(0,p.home.toString().length-1),
						SLIME_SCRIPT_DEBUGGER: (m && m.debug && m.debug.script) ? "rhino" : "none",
						JAVA_HOME: jsh.shell.java.home.toString()
					}),
					evaluate: function(result) {
						jsh.shell.echo("Executed " + command + " with status: " + result.status);
						if (result.status != 0) {
							jsh.shell.echo("command: " + result.command);
							jsh.shell.echo("arguments: " + result.arguments);
							jsh.shell.echo("environment: " + jsh.js.toLiteral(result.environment));
						}
						return result;
					}
				});
			}
		};

		var started = false;

		this.start = function(m) {
			jsh.shell.echo("Starting server at " + p.home + " with base " + base + " ...");

			if (jsh.java.Thread) {
				jsh.java.Thread.start({ call: catalina("run",m) });
			} else {
				var thread = new Packages.java.lang.Thread(new JavaAdapter(Packages.java.lang.Runnable, {
					run: function() {
						jsh.shell.echo("Calling run in thread " + Packages.java.lang.Thread.currentThread() + " catalina=" + catalina);
						catalina("run",m)();
					}
				}));
				jsh.shell.echo("Forking thread from " + Packages.java.lang.Thread.currentThread() + " ...");
				thread.start();
			}
			started = true;
		}

		this.stop = function() {
			if (started) {
				catalina("stop")();
			}
		}
	}
}