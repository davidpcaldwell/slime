//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.git.test.fixtures {
	export interface Context {
	}

	export type Exports = (fifty: slime.fifty.test.Kit) => {
		program: ReturnType<slime.jsh.Global["tools"]["git"]["program"]>
		empty: () => Repository
		edit: (repository: Repository, path: string, change: (before: string) => string) => void
	}

	export type Repository = {
		location: slime.jrunscript.file.world.Location
		api: ReturnType<ReturnType<slime.jrunscript.tools.git.Exports["program"]>["repository"]>
	};

	(
		function(
			$export: slime.loader.Export<Exports>
		) {
			$export(function(fifty: slime.fifty.test.Kit) {
				const { $api, jsh } = fifty.global;

				var program = jsh.tools.git.program({ command: "git" });

				var init: slime.jrunscript.tools.git.Command<void,void> = {
					invocation: function(p) {
						return {
							command: "init"
						}
					}
				}

				function empty(): Repository {
					var tmp = fifty.jsh.file.temporary.directory();
					var repository = jsh.tools.git.program({ command: "git" }).repository(tmp.pathname);
					repository.command(init).argument().run();
					return {
						location: tmp,
						api: repository
					}
				}

				function edit(repository: Repository, path: string, change: (before: string) => string) {
					var target = $api.Function.result(
						repository.location,
						jsh.file.world.Location.relative(path)
					);

					var before = $api.Function.result(
						target,
						$api.Function.pipe(
							$api.Function.world.question(jsh.file.world.Location.file.read.string()),
							$api.Function.Maybe.else(function() {
								return null as string;
							})
						)
					);

					var edited = change(before);

					var writeEdited = $api.Function.world.action(jsh.file.world.Location.file.write.string({ value: edited }));

					$api.Function.impure.now.output(target, writeEdited);
				}

				return {
					program,
					empty,
					edit
				};
			//@ts-ignore
			})
		}
	//@ts-ignore
	)($export);

	export type Script = slime.loader.Script<Context,Exports>
}
