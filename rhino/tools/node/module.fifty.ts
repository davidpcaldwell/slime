//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.node {
	export interface World {
		install: slime.$api.fp.world.Action<{ location: string, version: string }, void>
	}

	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			install: slime.jrunscript.tools.install.Exports
		}
		world?: World
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const { jsh } = fifty.global;
			var script: Script = fifty.$loader.script("module.js");
			return script({
				library: {
					file: jsh.file,
					shell: jsh.shell,
					install: jsh.tools.install
				}
			});
		//@ts-ignore
		})(fifty);
	}

	export interface Exports {
		test: {
			versions: {
				/**
				 * A previous Node version available for both macOS and Linux.
				 */
				previous: string
				current: string
			}

			world: World
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.world = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Functions {
	}

	export interface Exports {
		world: Functions
	}

	export namespace world {
		export interface Installation {
			executable: string
		}
	}

	export namespace world {
	}

	export interface Functions {
		getVersion: slime.$api.fp.world.Question<world.Installation,void,string>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			//	TODO	add to suite, would need to specify Linux URL first
			fifty.tests.world.installation = function() {
				var TMPDIR = fifty.jsh.file.temporary.location();
				var install = $api.Function.world.action(
					test.subject.test.world.install
				);
				install({
					location: TMPDIR.pathname,
					version: "16.15.1"
				});
				var installation: world.Installation = {
					executable: TMPDIR.pathname + "/bin/node"
				};
				var getVersion = $api.Function.world.question(test.subject.world.getVersion);
				verify(getVersion(installation)).is("v16.15.1");
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace object {
		/**
		 * A particular local installation of Node.js.
		 */
		export interface Installation {
			version: string

			location: string

			//	TODO	make the below a link?
			/**
			 * Executes a command or script using this Node.js installation.
			 *
			 * @param p Invocations are largely compatible with `rhino/shell` `run()`; differences are noted in the type definition
			 * for this parameter.
			 *
			 * @returns The type returned by `evaluate`, or the `rhino/shell` return value including process status, output, etc.
			 */
			run: <T = ReturnType<slime.jrunscript.shell.Exports["run"]>>(p: {
				/**
				 * (optional; default is just to run `node`) The Node.js command to run (as located in the Node `bin` directory).
				 */
				command?: string

				/**
				 * Specifies the location of a Node project; if indicated, commands will also be located in `node_modules/.bin`.
				 */
				project?: slime.jrunscript.file.Directory

				arguments?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["arguments"]
				directory?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["directory"]
				environment?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["environment"]
				stdio?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["stdio"]
				evaluate?: (p: any) => T
			}) => T

			toBashScript: (p: {
				command?: string
				project?: string
				arguments: string[]
				directory: string
				environment: {
					inherit: boolean
					values: { [x: string]: (string | null) }
				}
			}) => string

			/**
			 * An object representing the modules installed globally in this Node installation.
			 */
			modules: {
				/**
				 * An object with a property for each installed module; the name of the module is the name of the property.
				 */
				installed: {
					[key: string]: {
						version: string
						required: {
							version: string
						}
					}
				}

				install: (p: {
					/**
					 * The name of the module to install.
					 */
					name: string
				}) => void

				require: (p: { name: string, version?: string }) => void

				uninstall: Function
			}

			npm: {
				run: (p: {
					command: string
					global?: boolean
					arguments?: string[]
					stdio?: any
					evaluate?: any
					directory?: slime.jrunscript.file.Directory
				}) => any
			}
		}

		export namespace install {
			export interface Events {
				installed: slime.jrunscript.node.object.Installation
			}
		}
	}

	export interface Exports {
		at: (p: { location: string }) => slime.jrunscript.node.object.Installation

		/** @deprecated Use `at()`. */
		Installation: new (o: { directory: slime.jrunscript.file.Directory }) => slime.jrunscript.node.object.Installation

		install: slime.$api.fp.world.Action<{
			version?: string
			location: slime.jrunscript.file.Pathname
		},object.install.Events>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const { subject } = test;

			fifty.tests.installation = function() {
				var TMPDIR = fifty.jsh.file.temporary.location();
				verify(subject).at({ location: TMPDIR.pathname }).is(null);
				var tell = subject.install({
					location: jsh.file.Pathname(TMPDIR.pathname)
				});
				$api.Function.world.execute(tell, {
					installed: function(e) {
						jsh.shell.console("Installed: Node " + e.detail.version + " at " + e.detail.location);
					}
				});
				verify(subject).at({ location: TMPDIR.pathname }).is.type("object");
				verify(subject).at({ location: TMPDIR.pathname }).version.is("v" + subject.test.versions.current);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>

	export interface Plugin {
		module: (p: { context: Context }) => Exports
	}
}

namespace slime.jsh.shell.tools {
	export interface Exports {
		node: {
			installed: slime.jrunscript.node.object.Installation
			require: slime.$api.fp.world.Action<void,slime.jrunscript.node.object.install.Events & {
				removed: slime.jrunscript.node.object.Installation
				found: slime.jrunscript.node.object.Installation
			}>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			$api.Function.impure.now.process(
				$api.Function.world.action(jsh.shell.tools.node.require)
			)

			const api = jsh.shell.tools.node.installed;

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi.a = function() {
				var result = api.run({
					arguments: [fifty.jsh.file.object.getRelativePath("test/hello.js")],
					stdio: {
						output: String
					}
				});
				verify(result).stdio.output.is("Hello, World (Node.js)\n");
			}

			fifty.tests.jsapi.b = function() {
				//	TODO	should not be messing with global installation in tests
				if (api.modules["minimal-package"]) {
					api.run({
						command: "npm",
						arguments: ["uninstall", "-g", "minimal-package"]
					});
					api.modules["refresh"]();
				}
				verify(api).modules.installed.evaluate.property("minimal-package").is(void(0));
				var result = api.run({
					command: "npm",
					arguments: ["install", "-g", "minimal-package"]
				});
				api.modules["refresh"]();
				verify(api).modules.installed["minimal-package"].is.type("object");

				api.run({
					command: "npm",
					arguments: ["uninstall", "-g", "minimal-package"]
				});
				api.modules["refresh"]();
				verify(api).modules.installed.evaluate.property("minimal-package").is(void(0));
			}

			fifty.tests.jsapi.c = function() {
				if (api.modules["minimal-package"]) {
					api.modules.uninstall({
						name: "minimal-package"
					});
				}
				verify(api).modules.installed.evaluate.property("minimal-package").is(void(0));
				api.modules.install({
					name: "minimal-package"
				});
				verify(api).modules.installed["minimal-package"].is.type("object");

				api.modules.uninstall({
					name: "minimal-package"
				});
				verify(api).modules.installed.evaluate.property("minimal-package").is(void(0));
			}
		}
	//@ts-ignore
	)(fifty);
}

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		const { jsh } = fifty.global;

		fifty.tests.suite = function() {
			var api = jsh.shell.tools.node.installed;
			jsh.shell.console("version: " + api.version);
			fifty.run(fifty.tests.installation);
			fifty.run(fifty.tests.jsapi);
		}
	}
//@ts-ignore
)(fifty);
