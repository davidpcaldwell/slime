//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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
				jsh.shell.shell(
					jsh.file.Pathname("/bin/sh"),
					[
						p.home.getRelativePath("bin/catalina.sh"),
						command
					],
					{
						environment: jsh.js.Object.set({}, jsh.shell.environment, {
							//	Strip trailing slashes from path names, which appear to confuse catalina.sh
							//	TODO	see if it works without the stripping
							CATALINA_BASE: base.toString().substring(0,base.toString().length-1),
							CATALINA_HOME: p.home.toString().substring(0,p.home.toString().length-1),
							SLIME_SCRIPT_DEBUGGER: (m && m.debug && m.debug.script) ? "rhino" : "none"
						}),
						onExit: function(result) {
							jsh.shell.echo("Executed " + command + " with status: " + result.status);
						}
					}
				);
			}
		};

		var started = false;

		this.start = function(m) {
			jsh.shell.echo("Starting server at " + p.home + " with base " + base + " ...");

			new jsh.java.Thread(catalina("run",m)).start();
			started = true;
		}

		this.stop = function() {
			if (started) {
				catalina("stop")();
			}
		}
	}
}