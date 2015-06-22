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
		var home = (function() {
			if (jsh.shell.jsh.home)  {
				return jsh.shell.jsh.home;
			}
			var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
			jsh.shell.run({
				command: jsh.shell.java.jrunscript,
				arguments: [
					jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
					jsh.shell.jsh.src.getRelativePath("jsh/etc/unbuilt.rhino.js"),
					"build",
					tmpdir
				],
				environment: jsh.js.Object.set({
					JSH_BUILD_NOTEST: "true",
					JSH_BUILD_NODOC: "true",
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
				evaluate: (p.evaluate) ? p.evaluate : function(result) {
					if (result.status !== 0) throw new Error("Status is " + result.status);
					return JSON.parse(result.stdio.output);
				}
			})
		}

		var unbuilt = function(p) {
			return shell(jsh.js.Object.set({}, p, {
				shell: [
					src.getRelativePath("rhino/jrunscript/api.js"),
					src.getRelativePath("jsh/launcher/rhino/main.js")
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
			if (jsh.shell.rhino && jsh.shell.rhino.classpath) {
				properties["jsh.rhino.classpath"] = jsh.shell.rhino.classpath;
			}
			return built({
				properties: properties,
				script: p.script,
				arguments: ["-scenario", "-view", "child"],
				stdio: {
					output: write
				},
				evaluate: function(result) {
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

		this.add({
			scenario: new jsh.unit.Scenario.Integration({
				script: jsh.script.file.getRelativePath("packaged.jsh.js").file
			})
		});

		this.add(new function() {
			this.scenario = new function() {
				this.name = "Unbuilt, Rhino";
				this.execute = function(scope) {
					var verify = new jsh.unit.Verify(scope);
					var properties = {};
					if (jsh.shell.rhino && jsh.shell.rhino.classpath) {
						properties["jsh.rhino.classpath"] = jsh.shell.rhino.classpath;
					}
					properties["jsh.java.logging.properties"] = "/foo/bar";
					var result = unbuilt({
						properties: properties,
						arguments: []
					});
					verify(result).evaluate.property("src").is.not(null);
					verify(result).evaluate.property("home").is(null);
					verify(result).evaluate.property("logging").is("/foo/bar");
				}
			}
		});

		addScenario({
			name: "Built, Rhino",
			execute: function(verify) {
				var properties = {};
				properties["jsh.java.logging.properties"] = "/foo/bar";
				var result = built({
					properties: properties
				});
				verify(result).evaluate.property("src").is(null);
				verify(result).evaluate.property("home").is.not(null);
				verify(result).evaluate.property("logging").is("/foo/bar");
			}
		});
	},
	run: function(parameters) {
		var home = (jsh.shell.jsh.home) ? jsh.shell.jsh.home.toString() : null;
		var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src.toString() : null;
		var logging = (Packages.java.lang.System.getProperty("java.util.logging.config.file"))
			? String(Packages.java.lang.System.getProperty("java.util.logging.config.file"))
			: null
		;
		jsh.shell.echo(JSON.stringify({ src: src, home: home, logging: logging }));
	}
});