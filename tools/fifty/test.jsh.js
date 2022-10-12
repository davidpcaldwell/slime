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
		var isTypescriptInstalled = function() {
			var installation = jsh.shell.tools.node.installation;
			var nodeExists = $api.fp.world.input(
				jsh.shell.tools.node.world.Installation.exists(installation)
			)();
			if (!nodeExists) return false;
			var typescript = jsh.shell.tools.node.world.Installation.modules.installed("typescript");
			var tsInstalled = $api.fp.world.now.question(
				typescript,
				installation
			);
			//	TODO	this simply ensures that *some* version of TypeScript is installed.
			return tsInstalled.present;
		}

		//	We need to use this method, which forks a new shell, because we need TypeScript in this running shell in order to load
		//	the Fifty tests. May want to provide this as an API somewhere (currently there is one in jsh.wf, but it functions
		//	slightly differently; a `jsh` script requiring TypeScript is very foreseeable, though). Could generalize to require a
		//	specific TypeScript version, etc.
		jsh.shell.jsh.require({
			satisfied: isTypescriptInstalled,
			install: function() { jsh.wf.typescript.require(); }
		});

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

		var views = {
			console: (function() {
				var write = function(scope,string) {
					var indent = (scope) ? scope.depth() + 1 : 0;
					var prefix = new Array(indent + 1).join("  ")
					jsh.shell.console(prefix + string);
				};

				/** @type { slime.fifty.test.internal.Console } */
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

		var execute = function(file,part,view) {
			var fiftyLoader = jsh.script.loader;

			/** @type { slime.fifty.test.internal.test.Script } */
			var script = fiftyLoader.script("test.js");
			var implementation = script({
				library: {
					Verify: verify
				},
				console: view
			});

			var loader = new jsh.file.Loader({ directory: file.parent });

			return implementation.run(
				loader,
				{
					jsh: {
						directory: file.parent,
						loader: loader
					}
				},
				file.pathname.basename,
				part
			)
		};

		var list = function(file) {
			var fiftyLoader = jsh.script.loader;

			/** @type { slime.fifty.test.internal.test.Script } */
			var script = fiftyLoader.script("test.js");
			var implementation = script({
				library: {
					Verify: verify
				},
				//	TODO	probably can refactor so as to avoid this
				console: void(0)
			});

			var loader = new jsh.file.Loader({ directory: file.parent });

			return implementation.list(
				loader,
				{
					jsh: {
						directory: file.parent,
						loader: loader
					}
				},
				file.pathname.basename
			);
		}

		if (!parameters.options.list) {
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
