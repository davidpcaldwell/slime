//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.node {
	export interface Context {
		//	TODO	these obviously should be renamed to library
		module: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		},
		library: {
			install: slime.jrunscript.tools.install.Exports
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const { jsh } = fifty.global;
			var script: Script = fifty.$loader.script("module.js");
			return script({
				module: {
					file: jsh.file,
					shell: jsh.shell
				},
				library: {
					install: jsh.tools.install
				}
			});
		//@ts-ignore
		})(fifty);
	}

	interface Version {
		number: string
	}

	/**
	 * A particular local installation of Node.js
	 */
	export interface Installation {
		version: Version

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
			installed: { [key: string]: {
				version: string
				required: {
					version: string
				}
			} }

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
			console: string
		}
	}

	export interface Exports {
		at: (p: { location: string }) => slime.jrunscript.node.Installation

		/** @deprecated Use `at()`. */
		Installation: new (o: { directory: slime.jrunscript.file.Directory }) => slime.jrunscript.node.Installation

		install: (
			p: {
				version?: string
				location: slime.jrunscript.file.Pathname
				update?: boolean
			},
			events?: slime.$api.events.Handler<install.Events>
		) => slime.jrunscript.node.Installation
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const { subject } = test;

			fifty.tests.installation = function() {
				var TMPDIR = fifty.jsh.file.temporary.location();
				verify(subject).at({ location: TMPDIR.pathname }).is(null);
				subject.install({
					location: jsh.file.Pathname(TMPDIR.pathname)
				}, {
					console: function(e) {
						jsh.shell.console(e.detail);
					}
				});
				verify(subject).at({ location: TMPDIR.pathname }).is.type("object");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Project: Function,
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			function isInstalled(node: slime.jsh.Global["shell"]["tools"]["node"]): node is slime.jsh.shell.tools.node.Installed {
				return node["run"];
			}

			if (!isInstalled(jsh.shell.tools.node)) {
				jsh.shell.tools.node.install();
			}

			const node = jsh.shell.tools.node;

			var api: slime.jsh.shell.tools.node.Installed;
			if (isInstalled(node)) {
				api = node;
			} else {
				throw new TypeError();
			}

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

			fifty.tests.suite = function() {
				jsh.shell.console("version: " + api.version.number);
				fifty.run(fifty.tests.installation);
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
