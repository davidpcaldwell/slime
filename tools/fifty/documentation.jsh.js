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
		var $loader = $api.fp.now(
			jsh.script.world.file,
			jsh.file.Location.parent(),
			jsh.file.Location.directory.Loader.simple
		);

		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.fp.option.location({ longname: "base" }),
				jsh.script.cli.option.string({ longname: "chrome:id" }),
				jsh.script.cli.option.string({ longname: "host" }),
				jsh.script.cli.option.string({ longname: "index" }),
				jsh.script.cli.option.boolean({ longname: "watch"}),
				function(p) {
					jsh.shell.tools.tomcat.jsh.require.simple();

					var base = (p.options.base.present) ? p.options.base.value : jsh.shell.PWD.pathname.os.adapt();

					var operation = (p.options.watch) ? "document" : "documentation";

					var chromeId = (function(chromeId,operation) {
						if (chromeId) return chromeId;
						return operation;
					})(p.options["chrome:id"], operation);

					var host = (function(specified,operation,basename) {
						if (specified) return specified;
						return operation + "." + basename;
					})(p.options.host, operation, jsh.file.Location.basename(base));

					var index = p.options.index || "README.html";

					var code = {
						/** @type { slime.fifty.view.Script } */
						view: $loader.script("view.js")
					};

					var library = {
						view: code.view({
							library: {
								file: jsh.file,
								httpd: jsh.httpd
							}
						})
					};

					var server = library.view.server({
						base: jsh.file.Pathname(base.pathname).directory,
						watch: p.options.watch
					});

					//	Use dedicated Chrome browser if present
					if (jsh.shell.browser.chrome) {
						var pac = jsh.shell.jsh.src.getFile("rhino/ui/application-hostToPort.pac").read(String)
							.replace(/__HOST__/g, host)
							.replace(/__PORT__/g, String(server.port))
						;
						var instance = new jsh.shell.browser.chrome.Instance({
							location: jsh.file.Pathname(base.pathname).directory.getRelativePath("local/chrome/" + chromeId),
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
		);
	}
//@ts-ignore
)(Packages,$api,jsh);
