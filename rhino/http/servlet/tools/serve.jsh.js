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
	 */
	function($api,jsh) {
		jsh.shell.tools.tomcat.require();

		$api.Function.result(
			{ options: { index: "index.html" }, arguments: jsh.script.arguments },
			jsh.wf.cli.$f.option.pathname({ longname: "chrome:data" }),
			jsh.wf.cli.$f.option.string({ longname: "index" }),
			jsh.wf.cli.$f.option.number({ longname: "chrome:debug:port" }),
			function(p) {
				if (p.arguments.length == 0) {
					jsh.shell.console("Usage: serve.jsh.js [options] <directory>");
					jsh.shell.exit(1);
				}
				var directory = jsh.file.Pathname(p.arguments[0]).directory;
				if (!directory) {
					jsh.shell.console("Directory not found: " + jsh.file.Pathname(p.arguments[0]));
					jsh.shell.exit(1);
				}
				var tomcat = new jsh.httpd.Tomcat();
				tomcat.map({
					path: "",
					servlets: {
						"/*": {
							load: function(scope) {
								var loader = new jsh.file.Loader({ directory: directory });
								var handler = scope.httpd.Handler.Loader({ loader: loader, index: p.options.index });

								scope.$exports.handle = function(request) {
									return handler(request);
								};
							}
						}
					}
				})
				tomcat.start();
				jsh.shell.console("Serving: " + directory + " on port " + tomcat.port + " ...");
				if (p.options["chrome:data"]) {
					var chrome = new jsh.shell.browser.chrome.Instance({
						location: p.options["chrome:data"]
					});
					chrome.run({
						arguments: (function() {
							var rv = [];
							if (p.options["chrome:debug:port"]) {
								rv.push("--remote-debugging-port=" + p.options["chrome:debug:port"])
							}
							return rv;
						})(),
						uri: "http://127.0.0.1:" + tomcat.port + "/"
					});
				}
				tomcat.run();
			}
		)
	}
//@ts-ignore
)($api,jsh);
