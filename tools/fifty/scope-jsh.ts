//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.test.internal.scope.jsh {
	export interface Scope {
		loader: slime.Loader
		directory: slime.jrunscript.file.Directory
		filename: string
	}

	export type Export = (scope: slime.fifty.test.internal.scope.jsh.Scope) => slime.fifty.test.Kit["jsh"]

	export type Script = slime.loader.Script<void,Export>
}

(
	function($api: slime.$api.Global, jsh: slime.jsh.Global, $export: slime.loader.Export<slime.fifty.test.internal.scope.jsh.Export>) {
		var tmp = {
			location: function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var rv = directory.pathname;
				directory.remove();
				return rv;
			},
			directory: function() {
				return jsh.shell.TMPDIR.createTemporary({ directory: true }) as slime.jrunscript.file.Directory;
			}
		};

		$export(
			function(scope) {
				return {
					file: {
						relative: function(path) {
							var page = jsh.file.world.filesystems.os.pathname(scope.directory.toString());
							return page.relative(path);
						},
						temporary: {
							location: function() {
								var object = tmp.location();
								return jsh.file.world.filesystems.os.pathname(object.toString());
							},
							directory: function() {
								var object = tmp.directory();
								return jsh.file.world.filesystems.os.pathname(object.toString());
							}
						},
						object: {
							temporary: {
								location: tmp.location,
								directory: tmp.directory
							},
							getRelativePath: function(path) {
								return scope.directory.getRelativePath(path);
							}
						}
					},
					plugin: {
						mock: function(p) {
							return jsh.$fifty.plugin.mock(
								$api.Object.compose(
									p,
									{ $loader: scope.loader }
								)
							)
						}
					},
					$slime: jsh.unit.$slime,
					platforms: function(fifty) {
						return function() {
							fifty.run(function jsh() {
								fifty.tests.suite();
							});
							var runBrowser = jsh.shell.world.question(
								jsh.shell.Invocation.create({
									//	TODO	world-oriented
									command: fifty.global.jsh.shell.jsh.src.getRelativePath("fifty").toString(),
									arguments: [
										"test.browser",
										fifty.jsh.file.relative(scope.filename).pathname
									]
								})
							);
							var getBrowserResult = $api.Function.world.input(runBrowser);
							var result = getBrowserResult();
							fifty.verify(result, "browserResult").status.is(0);
						}
					}
				}
			}
		);
	}
//@ts-ignore
)($api, jsh, $export)
