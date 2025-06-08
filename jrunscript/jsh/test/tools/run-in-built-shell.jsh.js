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
		var parameters = jsh.script.getopts({
			options: {
				packaged: false,
				launcherDebug: false,
				rhinoDebug: false
			},
			unhandled: jsh.script.getopts.UNEXPECTED_OPTION_PARSER.SKIP
		});

		var JSH_HOME = jsh.shell.TMPDIR.createTemporary({ directory: true });
		//	TODO	locate jrunscript using Java home
		//	TODO	add these APIs for properties, etc., to jsh.shell.jrunscript
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

				var environment = Object.assign({}, jsh.shell.environment, (parameters.options.launcherDebug) ? {"JSH_LAUNCHER_DEBUG": "true"}: {});
				if (!parameters.options.packaged) {
					jsh.shell.console("Running in built shell ...");
					jsh.shell.jsh({
						shell: JSH_HOME,
						script: jsh.file.Pathname(parameters.arguments[0]).file,
						arguments: parameters.arguments.slice(1),
						environment: $api.Object.compose(jsh.shell.environment, (parameters.options.rhinoDebug) ? {
							JSH_DEBUG_SCRIPT: "rhino"
						} : {})
					});
					jsh.shell.console("Ran in built shell.");
				} else {
					//	TODO	revisit alternatives to the below
					var rhino = true;
					var to = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("packaged.jar");
					var script = parameters.arguments.shift();
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
						arguments: parameters.arguments,
						environment: environment
					});
				}
			}
		)();
	}
//@ts-ignore
)($api,jsh);
