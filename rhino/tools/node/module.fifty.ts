//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.node {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			install: slime.jrunscript.tools.install.Exports
		}
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
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.sandbox = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	/**
	 * A specified installation of Node.js. When determining whether Node.js is installed at a particular location, one can
	 * create an `Installation` using the `from.location` function, and then check for its existence with `exists`.
	 */
	export interface Installation {
		executable: string
	}

	export interface Module {
		name: string
		version: string
	}

	export namespace functions {
		export interface Installations {
			from: {
				location: (home: slime.jrunscript.file.Location) => Installation
			}
			exists: slime.$api.fp.world.Question<Installation,void,boolean>
			getVersion: slime.$api.fp.world.Question<Installation,void,string>
		}
	}

	export interface Exports {
		Installation: functions.Installations
	}

	export interface Exports {
		install: (to: string) => slime.$api.fp.world.Action<{ version: string },void>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			//	TODO	test still directly references world object
			fifty.tests.sandbox.installation = function() {
				var exists = $api.fp.world.mapping(test.subject.Installation.exists);
				var getVersion = $api.fp.world.mapping(test.subject.Installation.getVersion);

				var TMPDIR = fifty.jsh.file.temporary.location();
				var installation = test.subject.Installation.from.location(TMPDIR);

				var before = exists(installation);
				verify(before).is(false);

				$api.fp.world.now.tell(
					test.subject.install(TMPDIR.pathname.toString())({
						version: test.subject.test.versions.current
					})
				);

				var after = exists(installation);
				verify(after).is(true);
				var version = getVersion(installation);
				verify(version).is("v" + test.subject.test.versions.current);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Invocation {
		command?: string
		project?: string
		arguments?: slime.jrunscript.shell.invocation.Argument["arguments"]
		environment?: slime.jrunscript.shell.invocation.Argument["environment"]
		directory?: slime.jrunscript.shell.invocation.Argument["directory"]
		stdio?: slime.jrunscript.shell.invocation.Argument["stdio"]
	}

	export namespace functions {
		export interface Installations {
			invocation: (argument: Invocation) => (installation: Installation) => slime.jrunscript.shell.run.old.Invocation

			question: (argument: Invocation) => slime.$api.fp.world.Question<Installation,slime.jrunscript.shell.run.AskEvents,slime.jrunscript.shell.run.Exit>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.sandbox.question = function() {
					var TMPDIR = fifty.jsh.file.temporary.location();
					$api.fp.world.now.tell(
						test.subject.install(TMPDIR.pathname)({
							version: test.subject.test.versions.current
						})
					);
					var installation = test.subject.Installation.from.location(TMPDIR);
					debugger;
					var result = $api.fp.world.now.question(
						test.subject.Installation.question({
							arguments: [fifty.jsh.file.object.getRelativePath("test/hello.js").toString()],
							stdio: {
								output: "string"
							}
						}),
						installation
					);
					verify(result).stdio.output.is("Hello, World (Node.js)\n");
				}
			}
		//@ts-ignore
		)(fifty);

	}

	export namespace functions {
		export interface Installations {
			modules: {
				list: () => slime.$api.fp.world.Question<Installation, void, Module[]>

				installed: (name: string) => slime.$api.fp.world.Question<Installation, void, slime.$api.fp.Maybe<Module>>

				install: (p: { name: string, version?: string }) => slime.$api.fp.world.Action<Installation,void>

				require: (p: { name: string, version?: string }) => slime.$api.fp.world.Action<
					Installation,
					{
						found: slime.$api.fp.Maybe<Module>
						installing: void
						installed: Module
					}
				>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.npm = {};

			fifty.tests.wip = function() {
				var TMPDIR = fifty.jsh.file.temporary.location();
				$api.fp.world.now.action(
					test.subject.install(TMPDIR.pathname),
					{
						version: test.subject.test.versions.current
					}
				);
				var installation = test.subject.Installation.from.location(TMPDIR);

				var installedModule = $api.fp.world.mapping(
					test.subject.Installation.modules.installed("minimal-package"),
				)

				var before = installedModule(installation);

				verify(before).present.is(false);

				var findInListing = function() {
					var listing = $api.fp.world.now.question(
						test.subject.Installation.modules.list(),
						installation
					);
					var found = listing.find(function(module) {
						return module.name == "minimal-package";
					});
					return found;
				}

				verify(findInListing()).is(void(0));

				$api.fp.world.now.action(
					test.subject.Installation.modules.install({ name: "minimal-package" }),
					installation
				);

				var after = installedModule(installation);
				verify(after).present.is(true);
				if (after.present) {
					verify(after).value.version.is.type("string");
				}

				verify(findInListing()).is.type("object");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Functions {
		Installation: functions.Installations
	}

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
					environment?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["environment"]
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
		object: {
			at: (p: { location: string }) => slime.jrunscript.node.object.Installation

			install: slime.$api.fp.world.Action<{
				version?: string
				location: slime.jrunscript.file.Pathname
			},object.install.Events>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const { subject } = test;

			fifty.tests.object = {};

			fifty.tests.object.installation = function() {
				var TMPDIR = fifty.jsh.file.temporary.location();
				verify(subject).object.at({ location: TMPDIR.pathname }).is(null);
				var tell = subject.object.install({
					location: jsh.file.Pathname(TMPDIR.pathname)
				});
				$api.fp.world.execute(tell, {
					installed: function(e) {
						jsh.shell.console("Installed: Node " + e.detail.version + " at " + e.detail.location);
					}
				});
				verify(subject).object.at({ location: TMPDIR.pathname }).is.type("object");
				verify(subject).object.at({ location: TMPDIR.pathname }).version.is("v" + subject.test.versions.current);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}

namespace slime.jrunscript.node.internal {
	export interface JshPluginInterface {
		module: (p: { context: Context }) => Exports
	}

	//	TODO	this probably has a richer structure when --depth is not 0
	export interface NpmLsOutput {
		name: string
		dependencies: {
			[name: string]: {
				version: string
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.suite = function() {
				var api = jsh.shell.tools.node.installed;
				jsh.shell.console("version: " + api.version);
				fifty.run(fifty.tests.sandbox);
				fifty.run(fifty.tests.object.installation);
			}
		}
	//@ts-ignore
	)(fifty);
}
