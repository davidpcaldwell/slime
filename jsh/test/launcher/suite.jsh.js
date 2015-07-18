//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src : jsh.script.file.parent.parent.parent.parent;
if (!jsh.unit) {
	jsh.loader.plugins(src.getRelativePath("loader/api"));
	jsh.loader.plugins(src.getRelativePath("jsh/unit"));
	jsh.loader.plugins(src.getRelativePath("jsh/test"));
}
jsh.unit.integration({
	scenario: function() {
		var parameters = jsh.script.getopts({
			options: {
				rhino: jsh.file.Pathname
			}
		},arguments);

		var home = (function() {
			if (jsh.shell.jsh.home)  {
				return jsh.shell.jsh.home;
			}
			var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
			var properties = {};
			if (parameters.options.rhino) {
				properties["jsh.build.rhino.jar"] = parameters.options.rhino;
			}
			var propertyArguments = [];
			for (var x in properties) {
				propertyArguments.push("-D" + x + "=" + properties[x]);
			}
			jsh.shell.run({
				command: jsh.shell.java.jrunscript,
				arguments: propertyArguments.concat([
					jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
					"jsh",
					jsh.shell.jsh.src.getRelativePath("jsh/etc/build.jsh.js"),
					tmpdir
				]),
				environment: jsh.js.Object.set({
					JSH_BUILD_NOTEST: "true",
					JSH_BUILD_NODOC: "true",
					//	TODO	next two lines duplicate logic in jsh.test plugin
					TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
					PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
					PATH: jsh.shell.environment.PATH.toString()
				})
			});
			return tmpdir;
		})();

		var shell = function(p) {
			var vm = [];
			if (p.vmarguments) vm.push.apply(vm,p.vmarguments);
			for (var x in p.properties) {
				vm.push("-D" + x + "=" + p.properties[x]);
			}
			var script = (p.script) ? p.script : jsh.script.file;
			return jsh.shell.run({
				command: jsh.shell.java.jrunscript,
				arguments: vm.concat(p.shell).concat([script.toString()]).concat( (p.arguments) ? p.arguments : [] ),
				stdio: (p.stdio) ? p.stdio : {
					output: String
				},
				environment: jsh.js.Object.set({}, p.environment),
				evaluate: (p.evaluate) ? p.evaluate : function(result) {
					if (result.status !== 0) throw new Error("Status is " + result.status);
					jsh.shell.echo("Output: " + result.stdio.output);
					return JSON.parse(result.stdio.output);
				}
			})
		};

		var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

		var unbuilt = function(p) {
			return shell(jsh.js.Object.set({}, p, {
				shell: [
					src.getRelativePath("rhino/jrunscript/api.js"),
					src.getRelativePath("jsh/launcher/main.js")
				]
			}));
		};

		var built = function(p) {
			//	TODO	could we use built shell if we are running in built shell?
			return shell(jsh.js.Object.set({}, p, {
				shell: [
					home.getRelativePath("jsh.js")
				]
			}));
		}

		jsh.unit.Scenario.Integration = function(p) {
			var buffer = new jsh.io.Buffer();
			var write = buffer.writeBinary();
			var properties = {};
			if (parameters.options.rhino) {
				properties["jsh.engine.rhino.classpath"] = parameters.options.rhino;
			}
			return built({
				environment: p.environment,
				properties: properties,
				script: p.script,
				arguments: ["-scenario", "-view", "child"],
				stdio: {
					output: write
				},
				evaluate: function(result) {
//					jsh.shell.echo("Integration scenario exited.");
//					jsh.shell.echo("Stack = " + new Error().stack);
//					jsh.shell.echo("Rhino context = " + Packages.org.mozilla.javascript.Context.getCurrentContext());
					write.java.adapt().flush();
					buffer.close();
					return new jsh.unit.Scenario.Stream({
						name: p.script.toString(),
						stream: buffer.readBinary()
					});
				}
			})
		};

		var addScenario = (function(o) {
			this.add({ scenario: new function() {
				this.name = o.name;

				this.execute = function(scope) {
					var verify = new jsh.unit.Verify(scope);
					o.execute(verify);
				};
			}})
		}).bind(this);

//		//	TODO	does not appear to test packaging with Rhino when run from Nashorn
//		this.add({
//			scenario: new jsh.unit.Scenario.Integration({
//				script: jsh.script.file.getRelativePath("packaged.jsh.js").file
//			})
//		});

		var engines = [];
		if (new Packages.javax.script.ScriptEngineManager().getEngineByName("nashorn")) {
			engines.push("nashorn");
		}
		if (parameters.options.rhino) {
			engines.push("rhino");
		}

		engines.forEach(function(engine) {
			this.add({ scenario: new jsh.unit.Scenario.Integration({
				script: jsh.script.file.getRelativePath("packaged.jsh.js").file,
				environment: {
					PATH: jsh.shell.environment.PATH,
					//	TODO	below is used for Windows temporary files
					TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
					//	TODO	below is used for Windows command location
					PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
					JSH_ENGINE: engine
				}
			}) });

			[unbuilt,built].forEach(function(shell) {
				addScenario(new function() {
					var type = (shell == unbuilt) ? "unbuilt" : "built";
					this.name = engine + " " + type;

					this.execute = function(verify) {
						var properties = {};
						properties["jsh.log.java.properties"] = "/foo/bar";
						var result = shell({
							environment: {
								PATH: jsh.shell.environment.PATH,
								//	TODO	below is used for Windows temporary files
								TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
								//	TODO	below is used for Windows command location
								PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
								JSH_JVM_OPTIONS: "-Dfoo.1=bar -Dfoo.2=baz",
								JSH_ENGINE_RHINO_CLASSPATH: (parameters.options.rhino) ? String(parameters.options.rhino) : null,
								JSH_ENGINE: engine,
								JSH_SHELL_TMPDIR: tmp.toString()
								//,JSH_LAUNCHER_DEBUG: "true"
								//,JSH_DEBUG_JDWP: (engine == "rhino" && shell == built) ? "transport=dt_socket,address=8000,server=y,suspend=y" : null
							},
							properties: properties
						});
						if (shell == unbuilt) {
							verify(result).evaluate.property("src").is.not(null);
							verify(result).evaluate.property("home").is(null);
						} else {
							verify(result).evaluate.property("src").is(null);
							verify(result).evaluate.property("home").is.not(null);
						}
						verify(result).evaluate.property("logging").is("/foo/bar");
						verify(result).evaluate.property("foo1").is("bar");
						verify(result).evaluate.property("foo2").is("baz");
						verify(result).rhino.running.is( (engine == "rhino") );
						if (parameters.options.rhino) {
							verify(result).rhino.classpath.is.not(null);
						} else {
							//	We do not know; we could have been run inside a shell that has Rhino installed
//							verify(result).rhino.classpath.is(null);
						}
						verify(result).tmp.is(tmp.toString());

						if (engine == "rhino") {
							var result = shell({
								environment: {
									PATH: jsh.shell.environment.PATH,
									//	TODO	below is used for Windows temporary files
									TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
									//	TODO	below is used for Windows command location
									PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
									JSH_ENGINE_RHINO_CLASSPATH: String(parameters.options.rhino),
									JSH_ENGINE: "rhino",
									JSH_ENGINE_RHINO_OPTIMIZATION: 0
								}
							});
							verify(result).rhino.optimization.is(0);
						}
						if (engine == "nashorn" && parameters.options.rhino) {
							var result = shell({
								environment: {
									PATH: jsh.shell.environment.PATH,
									//	TODO	below is used for Windows temporary files
									TEMP: (jsh.shell.environment.TEMP) ? jsh.shell.environment.TEMP : "",
									//	TODO	below is used for Windows command location
									PATHEXT: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT : "",
									JSH_ENGINE_RHINO_CLASSPATH: null,
									JSH_ENGINE: engine
								}
							});
							verify(result,"shell_without_rhino").rhino.running.is(false);
						}
					}
				});
			});
		},this);
	},
	run: function(parameters) {
		var getProperty = function(name) {
			var rv = Packages.java.lang.System.getProperty(name);
			if (rv) return String(rv);
			return null;
		};

		var home = (jsh.shell.jsh.home) ? jsh.shell.jsh.home.toString() : null;
		var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src.toString() : null;
		var logging = getProperty("java.util.logging.config.file");
		var rhino = (function() {
			var rv = {
				running: (function() {
					if (typeof(Packages.org.mozilla.javascript.Context) != "function") return false;
					return Boolean(Packages.org.mozilla.javascript.Context.getCurrentContext());
				})()
			};
			rv.optimization = (rv.running) ? Number(Packages.org.mozilla.javascript.Context.getCurrentContext().getOptimizationLevel()) : null;
			rv.classpath = (jsh.shell.rhino && jsh.shell.rhino.classpath) ? String(jsh.shell.rhino.classpath) : null;
			return rv;
		})();
		jsh.shell.echo(
			JSON.stringify({
				src: src,
				home: home,
				logging: logging,
				foo1: getProperty("foo.1"),
				foo2: getProperty("foo.2"),
				tmp: String(jsh.shell.TMPDIR),
				rhino: rhino
			})
		);
	}
});