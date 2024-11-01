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

		$api.fp.world.execute(jsh.shell.tools.node.require.action);
		var typescriptVersionInstalled = $api.fp.now.invoke(
			void(0),
			$api.fp.pipe(
				jsh.shell.tools.node.Installation.modules(jsh.shell.tools.node.installation).installed("typescript"),
				$api.fp.Maybe.map(function(module) {
					return module.version == parameters.options.version;
				}),
				$api.fp.Maybe.else(function() {
					return false;
				})
			)
		);
		if (!typescriptVersionInstalled) {
			$api.fp.world.Action.now({
				action: jsh.shell.tools.node.Installation.modules(jsh.shell.tools.node.installation).install({ name: "typescript", version: parameters.options.version })
			});
		}

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
