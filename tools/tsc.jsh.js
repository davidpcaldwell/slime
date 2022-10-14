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

		$api.fp.world.execute(jsh.shell.tools.node.require());
		var typescriptVersionInstalled = $api.fp.result(
			jsh.shell.tools.node.installation,
			$api.fp.pipe(
				$api.fp.world.mapping(
					jsh.shell.tools.node.world.Installation.modules.installed("typescript")
				),
				$api.fp.Maybe.map(function(module) {
					return module.version == parameters.options.version;
				}),
				$api.fp.Maybe.else(function() {
					return false;
				})
			)
		);
		if (!typescriptVersionInstalled) {
			$api.fp.world.now.action(
				jsh.shell.tools.node.world.Installation.modules.install({ name: "typescript", version: parameters.options.version }),
				jsh.shell.tools.node.installation
			);
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
