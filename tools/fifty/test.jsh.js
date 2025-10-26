//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		//	For debugging issue #896, which is now closed, but leaving the code in case it recurs
		var debug896 = function(message) {
			if (jsh.shell.environment.SLIME_DEBUG_ISSUE_896) jsh.shell.console(message);
		}

		var isTypescriptInstalled = function() {
			debug896("isTypescriptInstalled: checking ...");
			var installation = jsh.shell.tools.node.installation;
			debug896("isTypescriptInstalled: checking ...");
			var nodeExists = $api.fp.world.input(
				jsh.shell.tools.node.Installation.exists.wo(installation)
			)();
			debug896("isTypescriptInstalled: nodeExists=" + nodeExists);
			if (!nodeExists) return false;
			var typescript = jsh.shell.tools.node.Installation.modules(installation).installed("typescript");
			debug896("isTypescriptInstalled: typescript=" + typescript);
			var tsInstalled = $api.fp.world.Question.now({
				question: typescript
			});
			debug896("isTypescriptInstalled: tsInstalled=" + tsInstalled);
			//	TODO	this simply ensures that *some* version of TypeScript is installed.
			return tsInstalled.present;
		}

		debug896("Requiring TypeScript ...");
		//	We need to use this method, which forks a new shell, because we need TypeScript in this running shell in order to load
		//	the Fifty tests. May want to provide this as an API somewhere (currently there is one in jsh.wf, but it functions
		//	slightly differently; a `jsh` script requiring TypeScript is very foreseeable, though). Could generalize to require a
		//	specific TypeScript version, etc.
		//	TODO	test-browser.jsh.js uses a much simpler method; is the above comment out of date? Is the other script wrong?
		$api.fp.world.now.tell(jsh.shell.jsh.require({
			satisfied: $api.fp.impure.Input.map(
				$api.fp.impure.Input.value(void(0)),
				$api.fp.impure.tap(function() {
					debug896("[fifty tsc check] Checking for TypeScript ...")
				}),
				isTypescriptInstalled,
				$api.fp.impure.tap(function(installed) {
					debug896("[fifty tsc check] TypeScript installed? " + installed);
				})
			),
			install: function() {
				debug896("Installing TypeScript ...");
				jsh.wf.typescript.require();
			}
		}));
		debug896("Required TypeScript.");

		/** @type { slime.jsh.script.cli.Processor<any, { definition: slime.jrunscript.file.File, list: boolean, part: string, view: string }> } */
		var processor = $api.fp.pipe(
			function(p) {
				var list = p.arguments[0];
				if (list == "list") {
					p.options.list = true;
					p.arguments = p.arguments.slice(1);
				}
				return p;
			},
			function(p) {
				var path = p.arguments[0];
				if (typeof(path) != "undefined") {
					var definition = jsh.script.getopts.parser.Pathname(path);
					if (!definition.file) {
						jsh.shell.console("File not found: " + path);
						jsh.shell.exit(1);
					}
					p.options.definition = definition.file;
					p.arguments = p.arguments.slice(1);
				}
				return p;
			},
			jsh.script.cli.option.string({ longname: "part" }),
			jsh.script.cli.option.string({ longname: "view", default: "console" })
		)

		var parameters = jsh.script.cli.invocation(processor);

		if (!parameters.options.definition) {
			jsh.shell.console("Required: test file to execute; not specified or not found.");
			jsh.shell.exit(1);
		}

		/** @type { slime.definition.verify.Export } */
		var verify = jsh.loader.file(jsh.shell.jsh.src.getFile("loader/api/verify.js"))

		/** @type { { console: slime.fifty.test.internal.Listener, jsapi: slime.fifty.test.internal.Listener } } */
		var views = {
			console: (function() {
				var write = function(scope,string) {
					var indent = (scope) ? scope.depth() + 1 : 0;
					var prefix = new Array(indent + 1).join("  ")
					jsh.shell.console(prefix + string);
				};

				/** @type { slime.fifty.test.internal.Listener } */
				var rv = {
					start: function(scope,name) {
						write(scope, "Running: " + name);
					},

					end: function(scope,name,result) {
						var resultString = (result) ? "PASSED" : "FAILED"
						write(scope, resultString + ": " + name);
					},

					test: function(scope,message,result) {
						write(scope, message);
					}
				};

				return rv;
			})(),
			jsapi: (function() {
				function output(v) {
					jsh.shell.echo(JSON.stringify(v));
				}

				return {
					start: function(scope, name) {
						output({
							type: "scenario",
							detail: {
								start: {
									name: name
								}
							}
						});
					},

					end: function(scope, name, result) {
						output({
							type: "scenario",
							detail: {
								end: {
									name: name
								},
								result: result
							}
						});
					},

					test: function(scope, message, success) {
						output({
							type: "test",
							detail: {
								success: success,
								message: message
								//	TODO	error
							}
						})
					}
				}
			})()
		};

		/**
		 *
		 * @param { slime.jrunscript.file.File } file
		 * @param { slime.fifty.test.internal.Listener } view
		 * @param { "run" | "list" } method
		 * @param { string } part
		 * @returns
		 */
		var load = function(file,view,method,part) {
			/** @type { slime.fifty.test.internal.scope.jsh.Script } */
			var scopeScript = jsh.script.loader.script("scope-jsh.ts");
			var scopes = scopeScript();

			var fiftyLoader = jsh.script.loader;

			/** @type { slime.fifty.test.internal.test.Script } */
			var testScript = fiftyLoader.script("test.js");

			var implementation = testScript({
				library: {
					Verify: verify
				},
				console: view,
				jsh: {
					global: jsh,
					scope: scopes
				}
			});

			var loader = new jsh.file.Loader({ directory: file.parent });

			return implementation[method]({
				loader: loader,
				scopes: {
					jsh: {
						directory: file.parent,
						loader: loader
					}
				},
				path: file.pathname.basename,
				part: part
			});
		}

		/**
		 *
		 * @param { slime.jrunscript.file.File } file
		 * @param { string } part
		 * @param { slime.fifty.test.internal.Listener } view
		 * @returns { slime.fifty.test.internal.test.Result }
		 */
		var execute = function(file,part,view) {
			//@ts-ignore
			return load(file, view, "run", part);
		};

		/**
		 *
		 * @param { slime.jrunscript.file.File } file
		 * @returns { slime.fifty.test.internal.test.Manifest }
		 */
		var list = function(file) {
			//@ts-ignore
			return load(file, views.console, "list", void(0));
		}

		if (!parameters.options.list) {
			//jsh.shell.console("Executing in " + jsh.script.file + " ...");
			var promise = execute(parameters.options.definition,parameters.options.part,views[parameters.options.view]);

			promise.then(function(success) {
				jsh.shell.exit( (success) ? 0 : 1 )
			});
		} else {
			var listing = list(parameters.options.definition);

			var addToList = function(rv,manifest,prefix) {
				if (!prefix) prefix = "";
				for (var x in manifest) {
					if (manifest[x].test) {
						rv.push(prefix + x);
					}
					addToList(rv, manifest[x].children, prefix + x + ".");
				}
			}

			var array = [];
			addToList(array,listing.children);
			array.forEach(function(name) {
				jsh.shell.console(name);
			});
		}
	}
//@ts-ignore
)($api,jsh);
