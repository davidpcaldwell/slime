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
		var parameters = jsh.script.getopts({
			options: {
				//	undocumented; used by suite.jsh.js
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

		var Environment = jsh.script.loader.file("jrunscript-environment.js").Environment;

		var environment = new Environment({
			src: jsh.script.file.parent.parent,
			home: parameters.options["shell:built"],
			noselfping: parameters.options.noselfping,
			executable: parameters.options.executable
		});

		var suite = new jsh.unit.html.Suite();

		var SRC = jsh.script.file.parent.parent;

		/**
		 *
		 * @param { { file: slime.jrunscript.file.File }} p
		 */
		var FiftyPart = function(p) {
			return jsh.unit.fifty.Part({
				shell: environment.jsh.unbuilt.src,
				script: SRC.getFile("loader/api/test/fifty/test.jsh.js"),
				file: p.file
			});
		}

		suite.add("internal/slime/fifty/runtime", FiftyPart({
			file: SRC.getFile("loader/expression.fifty.ts")
		}));

		suite.add("internal/slime/fifty/mime", FiftyPart({
			file: SRC.getFile("loader/mime.fifty.ts")
		}));

		suite.add("internal/slime/jsapi", new jsh.unit.html.Part({
			//	TODO	redundant; now tested per-engine in contributor/suite.jsh.js
			//	Functionality used internally or accessed through loader/jrunscript (although untested by loader/jrunscript)
			pathname: SRC.getRelativePath("loader/api.html")
		}));

		suite.add("internal/jrunscript/main", new jsh.unit.html.Part({
			//	Test cases of loader implementation
			//	TODO	redundant; now tested per-engine in contributor/suite.jsh.js
			pathname: SRC.getRelativePath("loader/jrunscript/api.html")
		}));
		suite.add("internal/jrunscript/java/fifty", FiftyPart({
			file: SRC.getFile("loader/jrunscript/java.fifty.ts")
		}));
		suite.add("internal/jrunscript/java/jsapi", new jsh.unit.html.Part({
			//	Test cases of loader implementation
			//	TODO	redundant; now tested per-engine in contributor/suite.jsh.js
			pathname: SRC.getRelativePath("loader/jrunscript/java.api.html")
		}));
		suite.add("internal/jrunscript/io", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/jrunscript/io.api.html"),
			environment: {
				$slime: jsh.unit.$slime
			}
		}));
		suite.add("internal/jrunscript/system", FiftyPart({
			file: SRC.getFile("rhino/system/test/Packages.inonit.system.fifty.ts")
		}));
		suite.add("internal/jrunscript/bootstrap", FiftyPart({
			file: SRC.getFile("rhino/jrunscript/api.fifty.ts")
		}));

		suite.add("internal/other", new jsh.unit.html.Part({
			//	Test cases involving the HTML test runner itself
			pathname: SRC.getRelativePath("loader/api/test/data/1/api.html")
			//	TODO	loader/jrunscript/java has some tests
			//	TODO	loader/jrunscript/test/data/2/ has some tests but they require some classes in classpath
		}));
		suite.add("internal/document/jsapi", new jsh.unit.Suite.Fork({
			run: jsh.shell.jsh,
			shell: (environment.jsh.built) ? environment.jsh.built.home : environment.jsh.unbuilt.src,
			script: SRC.getFile("loader/document/test/suite.jsh.js"),
			arguments: ["-view", "stdio"]
		}));
		suite.add("internal/document/fifty/old", FiftyPart({
			file: SRC.getFile("loader/document/test/module.fifty.ts")
		}));
		suite.add("internal/document/fifty/source", FiftyPart({
			file: SRC.getFile("loader/document/test/source.fifty.ts")
		}));

		suite.add("$api/flag", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/$api-flag.api.html")
		}));
		suite.add("$api/Function", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/$api-Function.api.html")
		}));
		suite.add("$api/main", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/$api.api.html")
		}));

		suite.add("js/web", FiftyPart({
			file: SRC.getFile("js/web/module.fifty.ts")
		}));

		suite.add("js/object/other", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("js/object/api.html")
		}));
		suite.add("js/object/Error", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("js/object/Error.api.html")
		}));

		suite.add("js/document", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("js/document/api.html")
		}));

		suite.add("js/time", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("js/time/api.html")
		}));

		suite.add("jrunscript/host/fifty", FiftyPart({
			file: SRC.getFile("jrunscript/host/module.fifty.ts")
		}));
		suite.add("jrunscript/host/jsapi", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jrunscript/host/api.html"),
			// TODO: why is supplying the module this way necessary?
			environment: Object.assign({}, environment, { module: jsh.java })
		}));

		suite.add("jrunscript/io/module", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jrunscript/io/api.html")
		}));

		suite.add("jrunscript/io/jsh", FiftyPart({
			file: SRC.getFile("jrunscript/io/plugin.jsh.fifty.ts")
		}));

		suite.add("jrunscript/io/mime", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jrunscript/io/mime.api.html")
		}));

		suite.add("jrunscript/io/grid", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jrunscript/io/grid.api.html")
		}));

		suite.add("jrunscript/file/main", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/file/api.html")
		}));

		suite.add("jrunscript/file/Searchpath", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/file/api.Searchpath.html")
		}));

		suite.add("jrunscript/ip", FiftyPart({
			file: SRC.getFile("rhino/ip/module.fifty.ts")
		}));

		suite.add("jrunscript/http", FiftyPart({
			file: SRC.getFile("rhino/http/client/module.fifty.ts")
		}));

		suite.add("jrunscript/document/module", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/document/api.html")
		}));
		suite.add("jrunscript/document/jsh", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/document/plugin.jsh.api.html"),
			environment: environment
		}));

		suite.add("jrunscript/shell/jsapi", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/shell/api.html"),
			environment: { noselfping: parameters.options.noselfping }
		}));
		suite.add("jrunscript/shell/fifty", FiftyPart({
			file: SRC.getFile("rhino/shell/module.fifty.ts")
		}));
		suite.add("jrunscript/shell/browser", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/shell/browser/api.html")
		}));

		suite.add("jrunscript/java/tools/api", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/tools/api.html")
		}));
		suite.add("jrunscript/java/tools/jsh", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/tools/plugin.jsh.api.html")
		}));
		// TODO: does this require hg be installed?
		if (jsh.tools.hg.init) suite.add("jrunscript/tools/hg", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/tools/hg/api.html")
		}));
		// TODO: does this require git be installed?
		if (!parameters.options.issue138) {
			suite.add(
				"jrunscript/tools/git/jsapi",
				new jsh.unit.html.Part({
					pathname: SRC.getRelativePath("rhino/tools/git/api.html")
				})
			);
			suite.add(
				"jrunscript/tools/git/fifty",
				FiftyPart({
					file: SRC.getFile("rhino/tools/git/module.fifty.ts")
				})
			);
		}
		suite.add("jrunscript/tools/github", FiftyPart({
			file: SRC.getFile("rhino/tools/github/module.fifty.ts")
		}));
		suite.add("jrunscript/tools/node", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/tools/node/api.html")
		}));

		(function jshLauncher() {
			var rhinoArgs = (jsh.shell.rhino) ? ["-rhino", jsh.shell.rhino.classpath.toString()] : [];

			//	TODO	Move these tests elsewhere; see issue #335
			var part = jsh.unit.Suite.Fork({
				name: "Launcher tests",
				run: jsh.shell.jsh,
				shell: environment.jsh.built.home,
				script: environment.jsh.src.getFile("jsh/launcher/test/suite.jsh.js"),
				arguments: [
					"-scenario",
					"-shell:unbuilt", environment.jsh.unbuilt.src,
					"-shell:built", environment.jsh.built.home,
					"-view", "stdio"
				].concat(rhinoArgs)
			});

			suite.add("jsh/launcher/suite", part);

			suite.add("jsh/launcher/internal", new jsh.unit.html.Part({
				pathname: environment.jsh.src.getRelativePath("jsh/launcher/internal.api.html"),
				environment: environment
			}));
		})();

		suite.add("jsh/loader", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jsh/loader/internal.api.html"),
			environment: environment
		}));

		suite.add("jsh/jsh.tools.install", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jsh/tools/install/plugin.jsh.api.html")
		}));

		suite.add("jsh/jsh.loader/jsapi", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jsh/loader/loader.api.html"),
			environment: environment
		}));

		suite.add("jsh/jsh.loader/fifty", FiftyPart({
			file: SRC.getFile("jsh/loader/jsh.fifty.ts")
		}));

		suite.add("jsh/jsh.shell/main", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/shell/plugin.jsh.api.html"),
			// TODO: do we actually need environment here?
			// TODO: do we actually need noselfping here?
			environment: Object.assign({}, environment, { noselfping: parameters.options.noselfping })
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

		suite.add("jsh/jsh.shell/suite", new jsh.unit.Suite.Fork(withShell({
			run: jsh.shell.jsh,
			script: SRC.getFile("rhino/shell/test/jsh.shell.jsh.suite.jsh.js"),
			arguments: ["-view","stdio"]
		})));

		suite.add("jsh/jsh.script/jsapi", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jsh/script/plugin.jsh.api.html"),
			environment: environment
		}));

		suite.add("jsh/jsh.script/fifty", FiftyPart({
			file: SRC.getFile("jsh/script/plugin.jsh.fifty.ts")
		}));

		suite.add("jsh/jsh.tools", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/tools/plugin.jsh.jsh.tools.api.html")
		}));

		suite.add("jsh-tools", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jsh/tools/internal.api.html"),
			environment: environment
		}));

		suite.add("testing/constructs", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/api/unit.api.html")
		}));
		suite.add("testing/html", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/api/api.html")
		}));
		suite.add("testing/jsh.unit/definition/jsapi", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jsh/unit/plugin.jsh.api.html")
		}));
		suite.add("testing/jsh.unit/definition/fifty/web", FiftyPart({
			file: SRC.getFile("jsh/unit/plugin.jsh.web.fifty.ts")
		}));
		suite.add("testing/fifty", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/api/test/fifty/test/data/api.html")
		}));
		//	TODO	disabling Bitbucket testing to try to get tests to pass after migration to GitHub. Examine to see whether there is
		//			something still needed, something analogous still needed, or whether this can be discarded
		if (false) suite.add("testing/jsh.unit/bitbucket", new jsh.unit.Suite.Fork({
			run: jsh.shell.jsh,
			shell: (environment.jsh.built) ? environment.jsh.built.homne : environment.jsh.unbuilt.src,
			script: SRC.getFile("jsh/unit/test/bitbucket.jsh.js"),
			arguments: ["-view", "stdio"]
		}));
		suite.add("testing/integration", new function() {
			var src = SRC;
			this.parts = {
				htmlReload: {
					execute: function(scope,verify) {
						var result = jsh.shell.jsh({
							shell: src,
							script: src.getFile("jsh/unit/test/fail.jsh.js"),
							evaluate: function(result) {
								return result;
							}
						});
						verify(result).status.is(1);
					}
				},
				// htmlReload: new ScriptPart({
				// 	shell: src,
				// 	script: src.getFile("jsh/unit/test/fail.jsh.js"),
				// 	check: function(verify) {
				// 		verify(this).status.is(1);
				// 	}
				// }),
				suiteWithScenario: new jsh.unit.Suite.Fork({
					run: jsh.shell.jsh,
					shell: src,
					script: src.getFile("jsh/unit/test/suite.jsh.js"),
					arguments: [
						"-view", "stdio"
					]
				}),
				nakedScenario: new jsh.unit.Suite.Fork({
					run: jsh.shell.jsh,
					shell: src,
					script: src.getFile("jsh/unit/test/scenario.jsh.js"),
					arguments: [
						"-view", "stdio"
					]
				}),
			}
		});

		var requireTomcat = function() {
			if (!environment.jsh.built.home.getSubdirectory("lib/tomcat")) {
				jsh.shell.jsh({
					shell: environment.jsh.built.home,
					script: environment.jsh.src.getFile("jsh/tools/install/tomcat.jsh.js")
				})
			}
		}

		suite.add("servlet/api", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/http/servlet/api.html")
		}));

		suite.add("servlet/resources/jsapi", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/http/servlet/plugin.jsh.resources.api.html")
		}));

		suite.add("servlet/resources/fifty", FiftyPart({
			file: SRC.getFile("rhino/http/servlet/plugin.jsh.resources.fifty.ts")
		}));

		suite.add("servlet/server", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/http/servlet/server/api.html")
		}));

		suite.add("servlet/jsh", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/http/servlet/plugin.jsh.api.html")
		}));

		// TODO: requires Tomcat, right?
		// TODO: move to rhino/http/servlet, creating internal.api.html?
		var servletPart = new function() {
			// TODO: enable
			var COFFEESCRIPT = false;

			this.initialize = function() {
				environment.jsh.built.requireTomcat();
			};

			this.parts = {};

			this.parts.suite = {
				execute: function(scope,verify) {
					var result = jsh.shell.jsh({
						shell: environment.jsh.built.home,
						script: environment.jsh.src.getFile("jsh/test/jsh.httpd/httpd.jsh.js")
					});
					verify(result).status.is(0);
				}
			};

			if (COFFEESCRIPT) {
				this.parts.coffee = {
					execute: function(scope,verify) {
						var result = jsh.shell.jsh({
							shell: environment.jsh.built.home,
							script: environment.jsh.src.getFile("jsh/test/jsh.httpd/httpd.jsh.js"),
							arguments: ["-suite", "coffee"]
						});
						verify(result).status.is(0);
					}
				}
			}
		};
		suite.add("servlet/suite", servletPart);

		suite.add("jsh/jsh.ui", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("rhino/ui/plugin.jsh.api.html")
		}));

		var fifty = function(p) {
			return {
				execute: function(scope,verify) {
					var result = jsh.shell.jsh({
						shell: jsh.shell.jsh.src,
						script: jsh.shell.jsh.src.getFile("loader/api/test/fifty/test.jsh.js"),
						arguments: [
							jsh.shell.jsh.src.getFile(p.path)
						]
					});
					verify(result).status.is(0);
				}
			}
		}

		if (!parameters.options.issue138) suite.add("tools/jsh/api", fifty({
			path: "tools/wf/plugin.jsh.fifty.ts"
		}));
		if (!parameters.options.issue138) suite.add("tools/jsh/standard", fifty({
			path: "tools/wf/plugin-standard.jsh.fifty.ts"
		}));

		//	TODO	disabling tests in order to try to get commit to succeed. Probably need to migrate this to a GitHub implementation
		if (false) suite.add("provision", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("jsh/tools/provision/api.html")
		}));

		jsh.unit.html.cli({
			suite: suite,
			view: parameters.options.view,
			part: parameters.options.part
		});
	}
//@ts-ignore
)(jsh);
