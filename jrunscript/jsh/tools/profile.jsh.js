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
		var options = $api.fp.pipe(
			jsh.script.cli.option.pathname({ longname: "profiler:javassist" }),
			jsh.script.cli.option.pathname({ longname: "profiler:output:html" }),
			jsh.script.cli.option.pathname({ longname: "profiler:output:json" }),
			jsh.script.cli.option.array({ longname: "profiler:exclude", value: function(string) {
				return string;
			}}),
			jsh.script.cli.option.boolean({ longname: "profiler:built" }),
			jsh.script.cli.option.boolean({ longname: "profiler:nobrowser" }),
			jsh.script.cli.option.string({ longname: "profiler:property" })
		);

		/**
		 *
		 * @param { slime.jrunscript.file.Pathname } pathname
		 */
		var isUnderSlime = function(pathname) {
			return $api.fp.string.startsWith(jsh.shell.jsh.src.toString())(pathname.toString());
		};

		var pathUnderSlime = function(pathname) {
			if (!isUnderSlime(pathname)) throw new Error();
			return pathname.toString().substring(jsh.shell.jsh.src.toString().length);
		}

		jsh.script.cli.run(
			$api.fp.pipe(
				options,
				function(parameters) {
					var output = (function() {
						if (!parameters.options["profiler:output:html"] && !parameters.options["profiler:output:json"]) {
							return {
								html: jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("profile.html"),
								json: null
							}
						}
						return {
							html: parameters.options["profiler:output:html"],
							json: parameters.options["profiler:output:json"]
						};
					})();
					[output.html, output.json].forEach(function(location) {
						if (location) location.parent.createDirectory({
							exists: function(dir) {
								return false;
							}
						})
					});

					var src = jsh.script.file.parent.parent.parent;
					var profiler;
					if (parameters.options["profiler:built"]) {
						var home = jsh.shell.TMPDIR.createTemporary({ directory: true });
						jsh.shell.jsh({
							script: src.getFile("jsh/etc/build.jsh.js"),
							arguments: [
								"-nounit", "-notest",
								"-nodoc",
								home
							]
						});
						jsh.shell.console("Built to " + home);
						profiler = home.getRelativePath("tools/profiler.jar")
					} else {
						profiler = jsh.shell.TMPDIR.createTemporary({ prefix: "profiler.", suffix: ".jar" });
					}

					if (parameters.options["profiler:built"]) {
						jsh.shell.jsh({
							shell: home,
							script: src.getFile("jsh/tools/install/profiler.jsh.js")
						});
					} else {
						jsh.shell.jsh({
							fork: true,
							script: jsh.shell.jsh.src.getFile("rhino/tools/profiler/build.jsh.js"),
							arguments: (function() {
								var rv = [];
								if (parameters.options["profiler:javassist"]) {
									rv.push("-javassist", parameters.options["profiler:javassist"]);
								}
								rv.push("-to", profiler);
								return rv;
							})()
						});
					}

					var configuration = [];
					if (output.html) {
						configuration.push("html=" + output.html);
					}
					if (output.json) {
						configuration.push("json=" + output.json);
					}
					parameters.options["profiler:exclude"].forEach(function(pattern) {
						configuration.push("exclude=" + pattern);
					});
					var properties = {
						"jsh.debug.script": (configuration.length) ? "profiler:" + configuration.join(",") : "profiler",
						"jsh.shell.profiler": profiler.toString()
					};
					if (jsh.shell.rhino) {
						properties["jsh.engine.rhino.classpath"] = String(jsh.shell.rhino.classpath);
					}
					if (parameters.options["profiler:property"]) {
						var split = parameters.options["profiler:property"].split("=");
						parameters.arguments.unshift("-D" + split[0] + "=" + split[1]);
					}

					if (!parameters.options["profiler:built"]) {
						jsh.shell.jrunscript.old({
							properties: properties,
							arguments: [jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),"jsh"].concat(parameters.arguments)
						});
					} else {
						jsh.shell.jrunscript.old({
							properties: properties,
							arguments: [home.getRelativePath("jsh.js").toString()].concat(parameters.arguments)
						});
					}

					if (output.html && jsh.shell.browser.chrome && !parameters.options["profiler:nobrowser"]) {
						jsh.shell.browser.chrome.instance.open( { uri: String(output.html.java.adapt().toURL().toExternalForm()) } );
					} else if (output.json && isUnderSlime(output.json) && jsh.httpd.Tomcat && jsh.shell.browser.installed.chrome && !parameters.options["profiler:nobrowser"]) {
						jsh.shell.console("profiler: Serving JSON to browser ...");
						var server = jsh.httpd.Tomcat();
						server.servlet({
							load: function(scope) {
								scope.$exports.handle = scope.httpd.Handler.Loader({
									loader: new jsh.file.Loader({ directory: jsh.shell.jsh.src })
								})
							}
						});
						server.start();

						//	TODO	this somewhat awkward series of API calls is caused by using the unit testing browser implementation,
						//			which has a simpler API, rather than using the Chrome API directly. Should revisit.
						var browser = jsh.unit.browser.local.Chrome({
							program: jsh.shell.browser.installed.chrome.program,
							user: jsh.shell.jsh.src.getRelativePath("local/chrome/profiler").toString(),
							devtools: false,
							debugPort: 9222
						});

						browser.open({
							uri: "http://127.0.0.1:" + server.port + "/rhino/tools/profiler/viewer/viewer.html?profiles=../../../../" + pathUnderSlime(output.json)
						});
						server.run();
					} else if (output.json && !isUnderSlime(output.json)) {
						jsh.shell.console("Not under SLIME at " + jsh.shell.jsh.src + ": " + output.json);
					} else if (output.json && !jsh.httpd.Tomcat) {
						jsh.shell.console("Tomcat not installed.");
					}
				}
			)
		)

	}
//@ts-ignore
)($api, jsh);
