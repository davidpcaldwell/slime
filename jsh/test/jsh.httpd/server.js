//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.server = (function() {
	if (!jsh.file.Pathname("/bin/sh").file) {
		jsh.shell.echo("No Bourne shell at /bin/sh; cannot run automated inside-Tomcat tests");
		return;
	}
	var CATALINA_HOME = (function() {
		if (jsh.shell.environment.CATALINA_HOME) return jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory;
		if (jsh.shell.jsh.lib.getSubdirectory("tomcat")) return jsh.shell.jsh.lib.getSubdirectory("tomcat");
	})();
	if (!CATALINA_HOME) {
		jsh.shell.echo("Tomcat not found; cannot run automated inside-Tomcat tests");
		return;
	}
	var ip = (function() {
		var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src : jsh.shell.jsh.home.getSubdirectory("src");
		return jsh.loader.module(src.getRelativePath("rhino/ip"));
	})();
	return new function() {
		var environment = {
			CATALINA_HOME: CATALINA_HOME,
			CATALINA_BASE: (function() {
				if ($context["tomcat.base"]) {
					return $context["tomcat.base"].directory;
				} else {
					return jsh.shell.TMPDIR.createTemporary({ directory: true });
				}
			})()
		};
		jsh.shell.echo("CATALINA_HOME: " + environment.CATALINA_HOME);
		jsh.shell.echo("CATALINA_BASE: " + environment.CATALINA_BASE);

		var tomcat = jsh.script.loader.file("httpd.tomcat.js");
		var installation = new tomcat.Tomcat({
			home: environment.CATALINA_HOME
		});
		var configuration = jsh.shell.TMPDIR.createTemporary();
		environment.CATALINA_HOME.getFile("conf/server.xml").copy(configuration.pathname, { filter: function() { return true; }});
		var controlPort = ip.getEphemeralPort();
		var httpPort = ip.getEphemeralPort();
		var ajpPort = ip.getEphemeralPort();
		configuration.pathname.write(
			configuration.read(String)
				.replace(new RegExp("8005", "g"), controlPort.number)
				.replace(new RegExp("8080", "g"), httpPort.number)
				.replace(new RegExp("8009", "g"), ajpPort.number)
			,{ append: false }
		)
		jsh.shell.echo("server.xml: " + configuration);
		var server = new installation.Base({
			base: environment.CATALINA_BASE,
			configuration: configuration
		});

		var build = function(servlets) {
			jsh.shell.echo("Building webapps ...");

			var buildWebapp = function(urlpath,servletpath) {
				//	TODO	may want to move this to httpd.tomcat.js, although it would need to somehow be aware of location of
				//			webapp.jsh.js
				var rhinoArguments = (typeof(Packages.org.mozilla.javascript.Context) == "function") ? [] : ["-norhino"];
				var coffeeScriptArguments = ($context.coffeescript) ? ["-library", "coffee-script.js=" + $context.coffeescript] : [];
				jsh.shell.jsh({
					fork: true,
					script: jsh.script.getRelativePath("../../../rhino/http/servlet/tools/webapp.jsh.js"),
					arguments: [
						"-to", environment.CATALINA_BASE.getSubdirectory("webapps").getRelativePath(urlpath),
						"-servletapi", environment.CATALINA_HOME.getRelativePath("lib/servlet-api.jar"),
						"-resources", jsh.script.getRelativePath("httpd.resources.js"),
						"-servlet", servletpath
					].concat(rhinoArguments).concat(coffeeScriptArguments),
					evaluate: function(result) {
						jsh.shell.echo("Command: " + [result.command].concat(result.arguments).join(" "));
						jsh.shell.echo("Status: " + result.status);
						if (result.status) {
							throw new Error("Exit status: " + result.status);
						}
					}
				});
			};
			for (var x in servlets) {
				buildWebapp(x,servlets[x]);
			}
		}

		this.port = httpPort.number;

		this.start = function(servlets) {
			build(servlets);
			jsh.shell.echo("Invoking Tomcat start script ...");
			server.start({
				debug: {
					script: $context["debug:server"]
				}
			});
			//	TODO	horrifying synchronization strategy
			jsh.shell.echo("Invoked Tomcat start script ...");
			debugger;
			jsh.shell.echo("Pausing to let Tomcat start ...");
			Packages.java.lang.Thread.sleep(5000);
			jsh.shell.echo("Continuing, assuming Tomcat has started.");
		}

		this.stop = function() {
			server.stop();
		}
	};
})();
