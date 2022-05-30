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
		var options = $api.Function.pipe(
			jsh.script.cli.option.pathname({ longname: "profiler:javassist" }),
			jsh.script.cli.option.pathname({ longname: "profiler:output" }),
			jsh.script.cli.option.array({ longname: "profiler:exclude", value: function(string) {
				return string;
			}}),
			jsh.script.cli.option.boolean({ longname: "profiler:built" }),
			jsh.script.cli.option.boolean({ longname: "profiler:nobrowser" }),
			jsh.script.cli.option.string({ longname: "profiler:property" })
		);

		jsh.script.cli.run(
			$api.Function.pipe(
				options,
				function(parameters) {
					if (!parameters.options["profiler:output"]) {
						parameters.options["profiler:output"] = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("profile.html");
					} else {
						parameters.options["profiler:output"].parent.createDirectory({
							exists: function(dir) {
								return false;
							},
							recursive: true
						});
					}

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
					if (parameters.options["profiler:output"]) {
						configuration.push("output=" + parameters.options["profiler:output"]);
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
						jsh.shell.jrunscript({
							properties: properties,
							arguments: [jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),"jsh"].concat(parameters.arguments)
						});
					} else {
						jsh.shell.jrunscript({
							properties: properties,
							arguments: [home.getRelativePath("jsh.js").toString()].concat(parameters.arguments)
						});
					}

					if (parameters.options["profiler:output"] && jsh.shell.browser.chrome && !parameters.options["profiler:nobrowser"]) {
						jsh.shell.browser.chrome.instance.open( { uri: String(parameters.options["profiler:output"].java.adapt().toURL().toExternalForm()) } );
					}
				}
			)
		)

	}
//@ts-ignore
)($api, jsh);
