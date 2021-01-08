//@ts-check
(
	/**
	 * @param { jsh } jsh
	 */
	function(jsh) {
		var parameters = jsh.wf.cli.$f.invocation(
			$api.Function.pipe(
				$api.Function.impure.revise(function(p) {
					var path = p.arguments.shift();
					if (typeof(path) != "undefined") {
						var definition = jsh.script.getopts.parser.Pathname(path);
						if (!definition.file) {
							jsh.shell.console("File not found: " + path);
							jsh.shell.exit(1);
						}
						p.options.definition = definition.file;
					}
				}),
				jsh.wf.cli.$f.option.string({ longname: "part" }),
				jsh.wf.cli.$f.option.string({ longname: "view" }),
				$api.Function.impure.revise(function(p) {
					if (!p.options.view) p.options.view = "console";
					if (!p.options.part) p.options.part = "suite";
				})
			)
		);

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
		}

		var execute = function(file,part,view) {
			var fiftyLoader = jsh.script.loader;

			/** @type { slime.fifty.test.internal.run } */
			var implementation = fiftyLoader.module("test.js", {
				library: {
					Verify: verify
				},
				console: view
			});

			var delegate = new jsh.file.Loader({ directory: file.parent });

			/** @type { mockjshplugin } */
			var mockPlugin = function(p) {
				return jsh.$fifty.plugin.mock(
					$api.Object.compose(
						p,
						{ $loader: delegate }
					)
				);
			}

			var loader = Object.assign(
				delegate,
				{
					getRelativePath: function(path) { return file.parent.getRelativePath(path); },
					plugin: {
						mock: mockPlugin
					},
					jsh: {
						plugin: {
							mock: mockPlugin
						}
					}
				}
			)

			return implementation(
				loader,
				file.pathname.basename,
				part
			)
		};

		var success = execute(parameters.options.definition,parameters.options.part,views[parameters.options.view]);

		jsh.shell.exit( (success) ? 0 : 1 )
	}
//@ts-ignore
)(jsh);
