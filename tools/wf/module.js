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
	 * @param { slime.jsh.wf.internal.module.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jsh.wf.internal.module.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var code = {
			/** @type { slime.jsh.wf.internal.typescript.Script } */
			typescript: $loader.script("typescript.js"),
		};

		var library = {
			typescript: code.typescript({
				library: {
					file: $context.library.file,
					shell: $context.library.shell,
					node: $context.library.node
				}
			})
		}

		var filesystem = ($context.world.filesystem) ? $context.world.filesystem : $context.library.file.world.filesystems.os;

		var exists = $api.fp.world.mapping($context.library.file.world.Location.file.exists());

		/**
		 *
		 * @param { slime.jsh.wf.Project } project
		 * @returns { slime.jrunscript.file.world.Location }
		 */
		var base = function(project) {
			return {
				filesystem: filesystem,
				pathname: project.base
			}
		};

		/** @type { (path: string) => slime.$api.fp.Partial<slime.jsh.wf.Project, slime.jrunscript.file.world.Location> } */
		var getProjectConfigurationFile = function(path) {
			return function(project) {
				var at = $api.fp.now.invoke(
					base(project),
					$context.library.file.world.Location.relative(path)
				);
				var created = $api.fp.now.invoke(
					at,
					exists
				);
				return (created) ? $api.fp.Maybe.from.some(at) : $api.fp.Maybe.from.nothing();
			};
		};

		/** @type { slime.jsh.wf.internal.module.Exports["Project"]["getTypescriptVersion"] } */
		var Project_getTypescriptVersion = $api.fp.pipe(
			base,
			$context.library.file.world.Location.relative("tsc.version"),
			$api.fp.world.mapping($context.library.file.world.Location.file.read.string()),
			$api.fp.Maybe.else(library.typescript.version)
		);

		var Project_getConfigurationFile = $api.fp.switch([
			getProjectConfigurationFile("tsconfig.json"),
			getProjectConfigurationFile("jsconfig.json")
		]);

		$export({
			typescript: library.typescript,
			input: {
				getTypescriptVersion: $api.deprecate(library.typescript.version)
			},
			Project: {
				getTypescriptVersion: Project_getTypescriptVersion,
				getConfigurationLocation: function(project) {
					var rv = Project_getConfigurationFile(project);
					if (rv.present) return rv.value;
					throw new Error("Configuration file not found in " + project.base);
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$loader,$export);
