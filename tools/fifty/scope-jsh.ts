//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.test.kit {
	export interface Jsh {
		$slime: slime.jsh.plugin.$slime
		file: {
			/**
			 * Returns a filesystem pathname corresponding to the given relative path, relative to the currently executing
			 * file.
			 */
			relative: (path: string) => slime.jrunscript.file.Location

			temporary: {
				location: () => slime.jrunscript.file.world.object.Location
				directory: () => slime.jrunscript.file.world.object.Location
			}

			object: {
				getRelativePath: (p: string) => slime.jrunscript.file.Pathname
				temporary: {
					location: () => slime.jrunscript.file.Pathname
					directory: () => slime.jrunscript.file.Directory
				}
			}

			mock: {
				fixtures: () => slime.jrunscript.file.mock.Fixtures
			}
		}
		plugin: {
			/**
			 * Allows a test to load `jsh` plugins into a mock shell. Loads plugins from the same directory as the
			 * shell, optionally specifying the global object, `jsh`, and the shared `plugins` object used by the jsh plugin
			 * loader.
			 */
			mock: slime.jsh.plugin.$slime["plugins"]["mock"]
			// mock: (p: {
			// 	global?: slime.jsh.plugin.Scope["global"]
			// 	jsh?: slime.jsh.plugin.Scope["jsh"]
			// 	plugins?: slime.jsh.plugin.plugins
			// 	$slime?: slime.jsh.plugin.$slime
			// }) => ReturnType<slime.jsh.loader.internal.plugins.Export["mock"]>
		}

		//	TODO	revise so that Kit is not needed as an argument; in test.js we already have it

		/**
		 * @deprecated Replaced by `fifty.test.platforms()`.
		 *
		 * Creates a test that will run the test suite (the `suite` part) under `jsh`, and then again under the browser,
		 * and pass only if both parts pass.
		 */
		platforms: () => void

		/**
		 * Internal; used to implement `fifty.multiplatform` when running Fifty under `jsh`.
		 */
		multiplatform: (p: {
			name: string
			jsh?: () => void
			browser?: () => void
		}) => void
	}
}

namespace slime.fifty.test.internal.scope.jsh {
	export interface Scope {
		/**
		 * A loader that will load resources from the same directory as the currently executing Fifty file.
		 */
		loader: slime.old.Loader

		/**
		 * The directory containing the currently executing Fifty file.
		 */
		directory: slime.jrunscript.file.Directory

		/**
		 * The filename of the currently executing Fifty file.
		 */
		filename: string

		fifty: Omit<slime.fifty.test.Kit,"jsh">
	}

	export type Export = (scope: slime.fifty.test.internal.scope.jsh.Scope) => slime.fifty.test.kit.Jsh

	export type Script = slime.loader.Script<void,Export>
}

(
	function($api: slime.$api.Global, jsh: slime.jsh.Global, $loader: slime.Loader, $export: slime.loader.Export<slime.fifty.test.internal.scope.jsh.Export>) {
		var tmp = {
			location: function() {
				var directory = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var rv = directory.pathname;
				directory.remove();
				return rv;
			},
			directory: function() {
				return jsh.shell.TMPDIR.createTemporary({ directory: true });
			}
		};

		$export(
			function(scope) {
				var file = {
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
							return jsh.file.world.filesystems.os.pathname(object.pathname.toString());
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
					},
					mock: {
						fixtures: function() {
							var script: slime.loader.Script<slime.jrunscript.file.internal.mock.Context,slime.jrunscript.file.mock.Fixtures> = $loader.script("../../rhino/file/mock.fixtures.ts");
							return script({
								library: {
									java: jsh.java,
									io: jsh.io
								}
							})
						}
					}
				};
				return {
					file: file,
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
					platforms: function() {
						var fifty = scope.fifty;
						return (fifty.global.jsh) ? function() {
							fifty.run(function jsh() {
								fifty.tests.suite();
							});
							var runBrowser = jsh.shell.world.question(
								jsh.shell.Invocation.from.argument({
									//	TODO	world-oriented
									command: fifty.global.jsh.shell.jsh.src.getRelativePath("fifty").toString(),
									arguments: [
										"test.browser",
										file.relative(scope.filename).pathname
									]
								})
							);
							var getBrowserResult = $api.fp.world.input(runBrowser);
							var result = getBrowserResult();
							fifty.verify(result, "browserResult").status.is(0);
						} : function() {
							throw new Error("fifty.jsh.platforms tests must be run under jsh.");
						}
					},
					multiplatform: function(suite) {
						var fifty = scope.fifty;
						var rv = Object.assign(
							function() {
								debugger;
								if (suite.jsh) fifty.run(function jsh() {
									suite.jsh();
								});
								var runBrowser = jsh.shell.world.question(
									jsh.shell.Invocation.from.argument({
										//	TODO	world-oriented
										command: fifty.global.jsh.shell.jsh.src.getRelativePath("fifty").toString(),
										arguments: [
											"test.browser",
											file.relative(scope.filename).pathname,
											"--part", suite.name + "." + "browser"
										]
									})
								);
								var getBrowserResult = $api.fp.world.input(runBrowser);
								var result = getBrowserResult();
								fifty.verify(result, "browserResult").status.is(0);
							},
							{
								jsh: suite.jsh,
								browser: suite.browser
							}
						);
						fifty.tests[suite.name] = rv;
					}
				}
			}
		);
	}
//@ts-ignore
)($api, jsh, $loader, $export)
