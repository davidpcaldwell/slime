//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		//	Currently, this script runs the test suite for a specific JRE and JavaScript engine.
		//
		//	It receives its configuration through a combination of command-line arguments and environment variables.
		//
		//	Some of the environment variables are `jsh`-based variables used to configure the shell in which this script is running.
		//
		//	Environment variables recognized by `jsh`:
		//	* `CATALINA_HOME`: A home to use for Tomcat.
		//	* `JSH_ENGINE`: The value to use for the JSH_ENGINE environment variable when running tests.
		//	* `JSH_ENGINE_RHINO_CLASSPATH`: TODO
		var parameters = jsh.script.getopts({
			options: {
				//	undocumented; used by jrunscript.jsh.js
				"shell:built": jsh.file.Pathname,

				//	TODO	currently ignored, was used to configure rhino/ip jsapi tests in the past. Should use new Fifty
				//			mechanism for configuring tests, whatever that is (system properties?)
				noselfping: false,
				issue138: false,

				executable: false,

				part: String,
				view: "console",

				// TODO: does this work? Is it necessary?
				"chrome:profile": jsh.file.Pathname
			}
		});

		var Environment = (
			function() {
				/** @type { slime.project.internal.jrunscript_environment.Script } */
				var script = jsh.script.loader.script("jrunscript-environment.js");
				return script({
					jsh: jsh
				})
			}
		)();

		var environment = new Environment({
			src: jsh.script.file.parent.parent,
			home: parameters.options["shell:built"],
			noselfping: parameters.options.noselfping,
			executable: parameters.options.executable
		});

		var suite = new jsh.unit.html.Suite();

		var SRC = jsh.script.file.parent.parent;

		// TODO: does this require hg be installed?
		if (jsh.tools.hg.init) suite.add("jrunscript/tools/hg", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/tools/hg/api.html")
		}));

		if (!parameters.options.issue138 && jsh.shell.PATH.getCommand("git")) {
			suite.add(
				"jrunscript/tools/git",
				new jsh.unit.html.Part({
					pathname: SRC.getRelativePath("rhino/tools/git/api.html")
				})
			);
		}

		suite.add("servlet/resources", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/http/servlet/plugin.jsh.resources.api.html")
		}));

		var withShell = function(p) {
			// TODO: moved this from integration tests and reproduced current test without much thought; could be that we should not be
			// using the built shell, or should be using more shells
			Object.defineProperty(p, "shell", {
				get: function() {
					return (environment.jsh.built) ? environment.jsh.built.home : environment.jsh.unbuilt.src;
				}
			});
			return p;
		};

		suite.add("jsh/jsh.shell/jsh", new jsh.unit.Suite.Fork(withShell({
			run: jsh.shell.jsh,
			script: SRC.getFile("jrunscript/jsh/shell/test/jsh.shell.jsh.suite.jsh.js"),
			arguments: ["-view","stdio"]
		})));

		suite.add("jsapi/other", new jsh.unit.html.Part({
			//	Test cases involving the HTML test runner itself
			pathname: SRC.getRelativePath("loader/api/old/test/data/1/api.html")
		}));

		suite.add("jsapi/html", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/api/old/api.html")
		}));

		suite.add("jsapi/jsh.unit/definition", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/api/old/jsh/plugin.jsh.api.html")
		}));

		suite.add("jsapi/fifty", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/api/old/fifty/api.html")
		}));

		//	TODO	disabling Bitbucket testing to try to get tests to pass after migration to GitHub. Examine to see whether there is
		//			something still needed, something analogous still needed, or whether this can be discarded
		if (false) suite.add("testing/jsh.unit/bitbucket", new jsh.unit.Suite.Fork({
			run: jsh.shell.jsh,
			shell: (environment.jsh.built) ? environment.jsh.built.home : environment.jsh.unbuilt.src,
			script: SRC.getFile("loader/api/old/jsh/test/bitbucket.jsh.js"),
			arguments: ["-view", "stdio"]
		}));

		suite.add("jsapi/integration", new function() {
			var src = SRC;
			this.parts = {
				htmlReload: {
					execute: function(scope,verify) {
						var result = jsh.shell.jsh({
							shell: src,
							script: src.getFile("loader/api/old/jsh/test/fail.jsh.js"),
							evaluate: function(result) {
								return result;
							}
						});
						verify(result).status.is(1);
					}
				},
				// htmlReload: new ScriptPart({
				// 	shell: src,
				// 	script: src.getFile("loader/api/old/jsh/test/fail.jsh.js"),
				// 	check: function(verify) {
				// 		verify(this).status.is(1);
				// 	}
				// }),
				suiteWithScenario: new jsh.unit.Suite.Fork({
					run: jsh.shell.jsh,
					shell: src,
					script: src.getFile("loader/api/old/jsh/test/suite.jsh.js"),
					arguments: [
						"-view", "stdio"
					]
				}),
				nakedScenario: new jsh.unit.Suite.Fork({
					run: jsh.shell.jsh,
					shell: src,
					script: src.getFile("loader/api/old/jsh/test/scenario.jsh.js"),
					arguments: [
						"-view", "stdio"
					]
				}),
			}
		});

		jsh.unit.html.cli({
			suite: suite,
			view: parameters.options.view,
			part: parameters.options.part
		});
	}
//@ts-ignore
)(jsh);
