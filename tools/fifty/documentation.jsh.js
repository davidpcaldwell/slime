//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		$api.fp.result(
			{ options: {}, arguments: jsh.script.arguments.slice() },
			jsh.script.cli.option.pathname({ longname: "base" }),
			jsh.script.cli.option.string({ longname: "chrome:id" }),
			jsh.script.cli.option.string({ longname: "host" }),
			jsh.script.cli.option.string({ longname: "index" }),
			jsh.script.cli.option.boolean({ longname: "watch"}),
			function(p) {
				jsh.shell.tools.tomcat.old.require();

				/** @type { slime.jrunscript.file.Directory } */
				var base = (p.options.base) ? p.options.base.directory : jsh.shell.PWD;

				var operation = (p.options.watch) ? "document" : "documentation";

				var chromeId = (function(chromeId,operation) {
					if (chromeId) return chromeId;
					return operation;
				})(p.options["chrome:id"], operation);

				var host = (function(host,operation) {
					if (host) return operation + "." + host;
					return operation;
				})(p.options.host, operation);

				var index = p.options.index || "README.html";

				var loader = new jsh.file.Loader({ directory: jsh.script.file.parent });
				var code = {
					/** @type { slime.fifty.view.Script } */
					project: loader.script("project.js")
				};

				var library = {
					project: code.project({
						library: {
							file: jsh.file,
							httpd: jsh.httpd
						}
					})
				};

				var server = library.project({
					base: base,
					watch: p.options.watch
				});

				//	Use dedicated Chrome browser if present
				if (jsh.shell.browser.chrome) {
					var pac = jsh.shell.jsh.src.getFile("rhino/ui/application-hostToPort.pac").read(String)
						.replace(/__HOST__/g, host)
						.replace(/__PORT__/g, String(server.port))
					;
					var instance = new jsh.shell.browser.chrome.Instance({
						location: base.getRelativePath("local/chrome/" + chromeId),
						proxy: jsh.shell.browser.ProxyConfiguration({
							code: pac
						})
					});
					instance.run({
						uri: "http://" + host + "/" + index
					});
				} else {
					//	Otherwise, fall back to Java desktop integration and default browser
					var supported = Packages.java.awt.Desktop.isDesktopSupported();
					if (supported) {
						Packages.java.awt.Desktop.getDesktop().browse( new Packages.java.net.URI( "http://127.0.0.1:" + server.port + "/" + index ) );
					} else {
						jsh.shell.console("Java Desktop integration not present; cannot launch browser to view documentation.");
						jsh.shell.exit(1);
					}
				}

				server.run();
			}
		)
	}
//@ts-ignore
)(Packages,$api,jsh)
