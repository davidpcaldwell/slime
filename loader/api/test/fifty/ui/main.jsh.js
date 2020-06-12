//@ts-check
(
	function(p) {
		var slime = {
			directory: p.file.parent.parent.parent.parent.parent.parent
		};
		slime.loader = new jsh.file.Loader({ directory: slime.directory });
		var server = new jsh.httpd.Tomcat();
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

		var invocation = $api.Function.result(
			{ options: {}, arguments: p.arguments },
			option.boolean({ longname: "nocache" }),
			option.boolean({ longname: "harness" }),
			option.boolean({ longname: "tsc-harness"}),
			option.boolean({ longname: "debug" })
		);

		if (invocation.options.harness) invocation.options.nocache = true;

		invocation.options.file = (invocation.options.harness || invocation.options["tsc-harness"])
			? slime.directory.getRelativePath("loader/api/test/fifty/test/data/module.d.ts")
			: void(0)
		;

		jsh.shell.console(JSON.stringify(
			$api.Object.compose(
				invocation.options,
				{ file: (invocation.options.file) ? invocation.options.file.toString() : void(0) }
			)
		));

		var getTscOutput = (function(options) {
			var rv = function() {
				return jsh.shell.run({
					command: slime.directory.getFile("loader/api/test/fifty/tsc.bash"),
					arguments: (options.file) ? [options.file] : [],
					environment: $api.Object.compose(
						jsh.shell.environment,
						{
							PROJECT: slime.directory,
							//	TODO	using void(0) below actually passed 'undefined', should do better
							NODE_DEBUG: (options.debug) ? "--inspect-brk" : ""
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
			if (!options.nocache) rv = $api.Function.memoized(rv);
			return rv;
		})(invocation.options);

		server.map({
			path: "/",
			resources: slime.loader,
			servlets: {
				"/*": {
					load: function(scope) {
						scope.$exports.handle = scope.httpd.Handler.series(
							function(request) {
								if (request.path == "") return scope.httpd.http.Response.resource($loader.get("index.html"));
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
		var host = "documentation";
		var browser = new jsh.shell.browser.chrome.Instance({
			location: slime.directory.getRelativePath("local/fifty/chrome" ),
			proxy: new jsh.shell.browser.ProxyConfiguration({
				code: slime.directory.getFile("rhino/ui/application-hostToPort.pac")
					.read(String)
					.replace(/__HOST__/g, host)
					.replace(/__PORT__/g, String(server.port))
			})
		});
		var path = (invocation.options["tsc-harness"]) ? "tsc.json" : ""
		browser.run({ uri: "http://" + host + "/" + path });
		server.run();
	}
)({
	file: jsh.script.file,
	options: {},
	arguments: jsh.script.arguments
})