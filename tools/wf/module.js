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
					node: $context.library.jsh.node
				},
				configuration: $context.configuration.typescript,
				world: {
					filesystem: ($context.world && $context.world.filesystem) ? $context.world.filesystem : void(0)
				}
			})
		}

		var project = {
			git: {
				/** @type { slime.jsh.wf.internal.module.Exports["project"]["git"]["installSlimeCredentialHelper"]["wo"] } */
				installSlimeCredentialHelper: function(project) {
					/** @type { slime.jrunscript.tools.git.Command<{ helper: string },void> } */
					var gitConfig = {
						invocation: function(p) {
							return {
								command: "config",
								arguments: $api.Array.build(function(it) {
									it.push("credential.helper", p.helper);
								})
							}
						}
					}

					return function(events) {
						if (!$context.library.shell.PATH.getCommand("git")) {
							events.fire("gitNotInstalled", { PATH: $context.library.shell.PATH.toString() });
							return;
						}
						var shell = $context.library.jsh.shell.jsh.Installation.from.current();
						if (!$context.library.jsh.shell.jsh.Installation.is.unbuilt(shell)) {
							events.fire("jshNotUnbuilt", shell);
							return;
						}
						$context.library.git.program({ command: "git" })
							.repository(project.base)
							.command(gitConfig)
							.argument({
								helper: $api.fp.now(
									shell.src,
									$context.library.file.Location.from.os,
									$context.library.file.Location.directory.relativePath("rhino/tools/git/git-credential-tokens-directory.bash"),
									$api.fp.property("pathname")
								)
							})
							.run()
						;
					}
				}
			}
		};

		$export({
			typescript: library.typescript.module,
			project: {
				typescript: library.typescript.Project,
				git: {
					installSlimeCredentialHelper: {
						wo: project.git.installSlimeCredentialHelper
					}
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$loader,$export);
