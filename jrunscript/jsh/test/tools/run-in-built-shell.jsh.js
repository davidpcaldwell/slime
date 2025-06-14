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
		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.option.boolean({ longname: "packaged" }),
				jsh.script.cli.option.boolean({ longname: "launcherDebug" }),
				jsh.script.cli.option.boolean({ longname: "rhinoDebug" }),
				function(p) {
					var JSH_HOME = jsh.shell.TMPDIR.createTemporary({ directory: true });
					//	TODO	locate jrunscript using Java home
					//	TODO	add these APIs for properties, etc., to jsh.shell.jrunscript.old
					var args = [];
					//				if (parameters.options.rhino) {
					//					args.push("-Djsh.build.rhino.jar=" + parameters.options.rhino);
					//				} else if (Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath")) {
					//					args.push("-Djsh.engine.rhino.classpath=" + Packages.java.lang.System.getProperty("jsh.engine.rhino.classpath"));
					//				}
					(
						function() {
							var SLIME = jsh.shell.jsh.src;
							args.push(SLIME.getRelativePath("jsh"));
							// args.push(SLIME.getRelativePath("rhino/jrunscript/api.js"));
							// args.push("jsh");
							args.push(SLIME.getRelativePath("jrunscript/jsh/etc/build.jsh.js"));
							args.push(JSH_HOME);
							args.push("-notest");
							args.push("-nodoc");
							// TODO: Rhino; other parameters jsh/test/plugin.jsh.js
							jsh.shell.run({
								command: "bash",
								arguments: args
							});
							jsh.shell.console("Completed build.");

							var environment = Object.assign({}, jsh.shell.environment, (p.options.launcherDebug) ? {"JSH_LAUNCHER_DEBUG": "true"}: {});
							if (!p.options.packaged) {
								jsh.shell.console("Running in built shell ...");
								jsh.shell.jsh({
									shell: JSH_HOME,
									script: jsh.file.Pathname(p.arguments[0]).file,
									arguments: p.arguments.slice(1),
									environment: $api.Object.compose(jsh.shell.environment, (p.options.rhinoDebug) ? {
										JSH_DEBUG_SCRIPT: "rhino"
									} : {
										JSH_DEBUG_SCRIPT: null
									})
								});
								jsh.shell.console("Ran in built shell.");
							} else {
								//	TODO	revisit alternatives to the below
								var rhino = true;
								var to = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("packaged.jar");
								var script = p.arguments.shift();
								jsh.shell.jsh({
									shell: JSH_HOME,
									script: jsh.shell.jsh.src.getFile("jrunscript/jsh/tools/package.jsh.js"),
									arguments: ([
										"-script", script,
										"-to", to
									]).concat( (!rhino) ? ["-norhino"] : [] )
								});
								//@ts-ignore
								jsh.shell.java({
									jar: to.file,
									arguments: p.arguments,
									environment: environment
								});
							}
						}
					)();
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
