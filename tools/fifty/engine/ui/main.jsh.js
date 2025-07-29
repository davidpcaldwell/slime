//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { { file: any, options: any, arguments: any }} p
	 */
	function($api,jsh,p) {
		var slime = {
			directory: p.file.parent.parent.parent.parent.parent.parent
		};
		slime.loader = new jsh.file.Loader({ directory: slime.directory });
		var server = jsh.httpd.Tomcat();
		var $loader = jsh.script.loader;

		var option = {
			value: function(o) {
				return function(p) {
					var rv = {
						options: $api.Object.compose(p.options),
						arguments: []
					};
					for (var i=0; i<p.arguments.length; i++) {
						if (o.longname && p.arguments[i] == "--" + o.longname) {
							rv.options[o.longname] = rv.arguments[++i];
						} else {
							rv.arguments.push(p.arguments[i]);
						}
					}
					return rv;
				}
			},
			boolean: function(o) {
				return function(p) {
					var rv = {
						options: $api.Object.compose(p.options),
						arguments: []
					};
					for (var i=0; i<p.arguments.length; i++) {
						if (o.longname && p.arguments[i] == "--" + o.longname) {
							rv.options[o.longname] = true;
						} else {
							rv.arguments.push(p.arguments[i]);
						}
					}
					return rv;
				}
			}
		}

		var invocation = $api.fp.result(
			{ options: {}, arguments: p.arguments },
			option.boolean({ longname: "nocache" }),
			option.boolean({ longname: "harness" }),
			option.boolean({ longname: "tsc-harness"}),
			option.boolean({ longname: "design" }),
			option.boolean({ longname: "node-debug" }),
			option.boolean({ longname: "chrome-debug" }),
			option.boolean({ longname: "debug" })
		);

		if (invocation.options.debug) invocation.options["node-debug"] = true;

		if (invocation.options.harness || invocation.options["tsc-harness"]) invocation.options.nocache = true;

		invocation.options.file = (invocation.options.harness || invocation.options["tsc-harness"] || invocation.options.design)
			? slime.directory.getRelativePath("tools/fifty/test/data/module.d.ts")
			: void(0)
		;

		invocation.options.project = (jsh.shell.environment.PROJECT)
			? jsh.file.Pathname(jsh.shell.environment.PROJECT).directory
			: jsh.shell.PWD

		var getTscOutput = (function(options) {
			var rv = function() {
				return jsh.shell.run({
					command: slime.directory.getFile("tools/fifty/tsc.bash"),
					arguments: (options.file) ? [options.file] : [],
					environment: $api.Object.compose(
						jsh.shell.environment,
						{
							PROJECT: options.project,
							//	TODO	using void(0) below actually passed 'undefined', should do better
							NODE_DEBUG: (options["node-debug"]) ? "--inspect-brk" : ""
						}
					),
					stdio: {
						output: String,
						error: String
					},
					evaluate: function(result) {
						jsh.shell.console("evaluate()");
						jsh.shell.console("result.arguments = " + result.arguments);
						jsh.shell.console("result.stdio.output = \n" + result.stdio.output);
						jsh.shell.console("result.stdio.error = \n" + result.stdio.error);
						return {
							status: result.status,
							stdout: result.stdio.output,
							stderr: result.stdio.error
						}
					}
				});
			};
			if (!options.nocache) rv = $api.fp.impure.Input.memoized(rv);
			return rv;
		})(invocation.options);

		server.map({
			path: "/",
			resources: slime.loader,
			servlets: {
				"/*": {
					load: function(scope) {
						var castToJrunscriptResource = function(resource) {
							/**
							 *
							 * @param { slime.Resource } p
							 * @returns { p is slime.jrunscript.runtime.old.Resource }
							 */
							var isJrunscriptResource = function(p) {
								return true;
							}

							if (isJrunscriptResource(resource)) return resource;
							throw new Error("Unreachable.");
						}
						scope.$exports.handle = scope.httpd.Handler.series(
							function(request) {
								if (request.path == "") return scope.httpd.http.Response.resource(castToJrunscriptResource($loader.get("index.html")));
							},
							function(request) {
								if (request.path == "tsc.json") {
									var result = getTscOutput();
									return {
										status: { code: 200 },
										body: {
											type: "application/json",
											string: result.stdout
										}
									}
								}
							},
							function(request) {
								var loader = new jsh.file.Loader({ directory: jsh.script.file.parent });
								var resource = loader.get(request.path);
								return (resource) ? scope.httpd.http.Response.resource(castToJrunscriptResource(resource)) : void(0);
							},
							scope.httpd.Handler.Child({
								filter: /^code\/slime\/(.*)/,
								handle: function(request) {
									var resource = slime.loader.get(request.path);
									return (resource) ? scope.httpd.http.Response.resource(resource) : {
										status: { code: 404 }
									}
								}
							})
						);
					}
				}
			}
		});
		server.start();
		var host = invocation.options.project.pathname.basename + ".fifty";
		var browser = new jsh.shell.browser.chrome.Instance({
			location: invocation.options.project.getRelativePath("local/chrome/fifty" ),
			proxy: jsh.shell.browser.ProxyConfiguration({
				code: slime.directory.getFile("rhino/ui/application-hostToPort.pac")
					.read(String)
					.replace(/__HOST__/g, host)
					.replace(/__PORT__/g, String(server.port))
			})
		});
		var path = (function() {
			if (invocation.options.design) return "?design";
			if (invocation.options["tsc-harness"]) return "tsc.json";
			return "";
		})();
		browser.run({
			uri: "http://" + host + "/" + path,
			arguments: (invocation.options["chrome-debug"]) ? ["--remote-debugging-port=9222"] : []
		});
		server.run();
	}
//@ts-ignore
)($api, jsh, { file: jsh.script.file, options: {}, arguments: jsh.script.arguments })
