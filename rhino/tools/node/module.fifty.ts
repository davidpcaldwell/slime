//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Tools for creating and interacting with Node.js installations.
 */
namespace slime.jrunscript.tools.node {
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

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.sandbox = fifty.test.Parent();

			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	/**
	 * Quick guide:
	 *
	 * * Install Node.js with the `install` function
	 * * You can do things with Node installations with the `Installation` functions
	 * * You can do things with Node projects the `Project` functions
	 */
	export interface Exports {
		versions: {
			/**
			 * The default version of Node.js used by this SLIME installation.
			 */
			default: () => string
		}
	}

	/**
	 * A specified installation of Node.js. When determining whether Node.js is installed at a particular location, one can
	 * create an `Installation` using the `from.location` function, and then check for its existence with `exists`.
	 */
	export interface Installation {
		executable: string
	}

	export interface Project {
		base: string
	}

	export interface Module {
		name: string
		version: string
		path: string
		bin: {
			[name: string]: string
		}
	}

	export namespace exports {
		export interface Installations {
			from: {
				/**
				 * Given a Node installation location, returns the Node `Installation` corresponding to that location.
				 *
				 * @param home The home directory of the `Installation`.
				 * @returns
				 */
				location: (home: slime.jrunscript.file.Location) => slime.jrunscript.tools.node.Installation
			}

			exists: {
				wo: slime.$api.fp.world.Sensor<slime.jrunscript.tools.node.Installation,void,boolean>
				simple: (installation: Installation) => boolean
			}

			getVersion: slime.$api.fp.world.Sensor<slime.jrunscript.tools.node.Installation,void,string>
		}
	}

	export interface Exports {
		/**
		 * Functions relating to {@link Installation} types.
		 */
		Installation: exports.Installations
	}

	export interface Exports {
		install: (to: string) => slime.$api.fp.world.Means<{ version: string },void>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			//	TODO	test still directly references world object
			fifty.tests.sandbox.installation = function() {
				var exists = $api.fp.now(test.subject.Installation.exists.wo, $api.fp.world.Sensor.mapping());
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

			fifty.tests.manual.install = function() {
				const { jsh } = fifty.global;

				var TO = (jsh.shell.environment.SLIME_TEST_MANUAL_INSTALL) ? jsh.shell.environment.SLIME_TEST_MANUAL_INSTALL : fifty.jsh.file.temporary.location().pathname;
				var install = test.subject.install(TO);
				$api.fp.world.Means.now({
					means: install,
					order: { version: test.subject.test.versions.current }
				})
				jsh.shell.console("TO = " + TO);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Intention {
		command?: string
		project?: string
		arguments?: slime.jrunscript.shell.run.Intention["arguments"]
		environment?: slime.jrunscript.shell.run.Intention["environment"]
		directory?: slime.jrunscript.shell.run.Intention["directory"]
		stdio?: slime.jrunscript.shell.run.Intention["stdio"]
	}

	export namespace exports {
		export interface Installations {
			Intention: {
				shell: (argument: Intention) => (installation: slime.jrunscript.tools.node.Installation) => slime.jrunscript.shell.run.Intention
				question: (argument: Intention) => slime.$api.fp.world.Sensor<slime.jrunscript.tools.node.Installation,slime.jrunscript.shell.run.AskEvents,slime.jrunscript.shell.run.Exit>
			}

			/** @deprecated */
			question: Installations["Intention"]["question"]
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
						test.subject.Installation.Intention.question({
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

	export namespace exports {
		export interface Modules {
			list: () => slime.$api.fp.world.Question<void, Module[]>

			installed: (name: string) => slime.$api.fp.world.Question<void, slime.$api.fp.Maybe<Module>>

			install: (p: { name: string, version?: string }) => slime.$api.fp.world.Action<void>

			require: (p: { name: string, version?: string }) => slime.$api.fp.world.Action<
				{
					/**
					 * After searching for the named module in the existing installation, the module found (if any).
					 */
					found: slime.$api.fp.Maybe<Module>

					/**
					 * Before installing the given {@link Module}.
					 */
					installing: { name: string, version?: string }

					/**
					 * After installing the given {@link Module}.
					 */
					installed: Module
				}
			>

			project?: {
				install: slime.$api.fp.impure.Process
			}
		}
	}

	export namespace exports {
		export interface Installations {
			modules: (installation: node.Installation) => Modules
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

				var modules = test.subject.Installation.modules(installation);

				var installedModule = modules.installed("minimal-package");

				var before = $api.fp.world.Question.now({ question: installedModule });

				verify(before).present.is(false);

				var findInListing = function() {
					var listing = $api.fp.world.Question.now({
						question: modules.list()
					});
					var found = listing.find(function(module) {
						return module.name == "minimal-package";
					});
					return found;
				}

				verify(findInListing()).is(void(0));

				$api.fp.world.Action.now({
					action: modules.install({ name: "minimal-package" })
				});

				var after = $api.fp.world.Question.now({ question: installedModule });
				verify(after).present.is(true);
				if (after.present) {
					verify(after).value.version.is.type("string");
				}

				verify(findInListing()).is.type("object");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Project: exports.Project
	}

	export namespace exports {
		export interface Project {
			modules: (project: node.Project) => (installation: node.Installation) => Modules
		}
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
				installed: slime.jrunscript.tools.node.object.Installation
			}
		}
	}

	export interface Exports {
		object: {
			at: (p: { location: string }) => slime.jrunscript.tools.node.object.Installation

			install: slime.$api.fp.world.Means<{
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

	export type Script = slime.loader.Script<Context,Exports>
}

namespace slime.jrunscript.tools.node.internal {
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
