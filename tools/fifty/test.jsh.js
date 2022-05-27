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
		jsh.wf.typescript.require();

		/** @type { slime.jsh.script.cli.Processor<any, { definition: slime.jrunscript.file.File, part: string, view: string }> } */
		var processor = $api.Function.pipe(
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

			return implementation(
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

		var promise = execute(parameters.options.definition,parameters.options.part,views[parameters.options.view]);
		promise.then(function(success) {
			jsh.shell.exit( (success) ? 0 : 1 )
		});
	}
//@ts-ignore
)($api,jsh);
