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
				tsconfig: jsh.file.Pathname,
				version: String
			}
		});

		if (!parameters.options.tsconfig) {
			//	TODO	what if file does not exist?
			jsh.shell.console("Required: -tsconfig <path-to-tsconfig-or-jsconfig.json>");
			jsh.shell.exit(1);
		}

		if (!parameters.options.version) {
			jsh.shell.console("Required: -version <typescript-version>");
			jsh.shell.exit(1);
		}

		jsh.shell.tools.node.require();
		jsh.shell.tools.node.modules.require({ name: "typescript", version: parameters.options.version });

		//	TODO	should jsh.shell.tools.node.require return an installation? does it? Should the below be part of it?
		var nodeBin = jsh.script.file.parent.parent.getSubdirectory("local/jsh/lib/node/bin");

		//	TODO	re-implement tsc.bash in terms of this script; see jsh/tools/install/typescript.jsh.js
		var PATH = jsh.file.Searchpath(jsh.shell.PATH.pathnames.concat([nodeBin.pathname]));
		var environment = $api.Object.compose(jsh.shell.environment, {
			PATH: PATH.toString()
		});
		jsh.shell.run({
			command: nodeBin.getFile("tsc"),
			arguments: [
				"--p", parameters.options.tsconfig
			],
			environment: environment,
			evaluate: function(result) {
				jsh.shell.exit(result.status);
			}
		});
	}
//@ts-ignore
)($api,jsh);
