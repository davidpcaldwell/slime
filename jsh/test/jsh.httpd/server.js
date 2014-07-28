$exports.server = (function() {
	if (!jsh.file.Pathname("/bin/sh").file) {
		jsh.shell.echo("No Bourne shell at /bin/sh; cannot run automated inside-Tomcat tests");
		return;
	}
	if (!jsh.shell.environment.CATALINA_HOME) {
		jsh.shell.echo("No $CATALINA_HOME; cannot run automated inside-Tomcat tests");
		return;
	}
	return new function() {
		var environment = {
			CATALINA_HOME: jsh.file.Pathname(jsh.shell.environment.CATALINA_HOME).directory,
			CATALINA_BASE: (function() {
				if (parameters.options["tomcat.base"]) {
					return parameters.options["tomcat.base"].directory;
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
		var server = new installation.Base({
			base: environment.CATALINA_BASE,
			configuration: environment.CATALINA_HOME.getFile("conf/server.xml")
		});

		var build = function() {
			jsh.shell.echo("Building webapps ...");

			var buildWebapp = function(urlpath,servletpath) {
				//	TODO	may want to move this to httpd.tomcat.js, although it would need to somehow be aware of location of
				//			webapp.jsh.js
				var rhinoArguments = (typeof(Packages.org.mozilla.javascript.Context) == "function") ? [] : ["-norhino"];
				jsh.shell.jsh({
					fork: true,
					script: jsh.script.getRelativePath("../../../rhino/http/servlet/tools/webapp.jsh.js"),
					arguments: [
						"-to", environment.CATALINA_BASE.getSubdirectory("webapps").getRelativePath(urlpath),
						"-servletapi", environment.CATALINA_HOME.getRelativePath("lib/servlet-api.jar"),
						"-resources", jsh.script.getRelativePath("httpd.resources.js"),
						"-servlet", servletpath
					].concat(rhinoArguments),
					evaluate: function(result) {
						jsh.shell.echo("Command: " + [result.command].concat(result.arguments).join(" "));
						jsh.shell.echo("Status: " + result.status);
						if (result.status) {
							throw new Error("Exit status: " + result.status);
						}
					}
				});
			};
			buildWebapp("slime.hello", "test/hello.servlet.js");
			buildWebapp("slime.file", "test/file.servlet.js");
			buildWebapp("slime.api", "test/api.servlet.js");
		}

		this.start = function() {
			build();
			jsh.shell.echo("Invoking Tomcat start script ...");
			server.start({
				debug: {
					script: parameters.options["debug:server"]
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

