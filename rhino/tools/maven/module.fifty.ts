//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides APIs relating to the Apache Maven build tool, including the ability to install Maven.
 *
 * APIs are described by the {@link slime.jrunscript.tools.maven.Exports} object. In `jsh` shells, these APIs are available as the
 * `jsh.tools.maven` object.
 *
 * The module also provides a `mvnw.jsh.js` script that can be used to configure the Maven wrapper on a project, optionally first creating
 * the project using a Maven archetype. See {@link slime.jrunscript.tools.maven.script.mvnw}.
 */
namespace slime.jrunscript.tools.maven {
	export interface Context {
		HOME: slime.jrunscript.file.Directory
		java: slime.jrunscript.shell.Exports["java"]
		mvn: any

		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			install: slime.jrunscript.tools.install.Exports
		}

		jsh: {
			js: slime.js.old.Exports & {
				document: any
			}
			io: slime.jrunscript.io.Exports
			shell: slime.jsh.shell.Exports
			document: slime.jsh.Global["document"]
		}
	}

	export namespace test {
		export const subject = (
			function(fifty: slime.fifty.test.Kit) {
				const { jsh } = fifty.global;
				var script: Script = fifty.$loader.script("module.js");
				return script({
					library: {
						file: jsh.file,
						shell: jsh.shell,
						install: jsh.tools.install
					},
					HOME: jsh.shell.HOME,
					java: jsh.shell.java,
					mvn: jsh.shell.PATH.getCommand("mvn"),
					jsh: jsh
				})
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();

			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Installation {
		home: string
	}

	export namespace exports {
		export interface Installation {}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Installation = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		Installation: exports.Installation
	}

	export namespace exports {
		export interface Installation {
			require: {
				world: slime.$api.fp.world.Means<
					{
						installation: maven.Installation
						accept?: (version: string) => boolean
						version: string
					},
					{
						found: { version: string }
						installed: { version: string }
					}
				>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;
				const { subject } = test;

				fifty.tests.exports.Installation.require = function() {
					var tmp = fifty.jsh.file.temporary.location();

					fifty.run(
						function() {
							var captor = fifty.$api.Events.Captor({ found: void(0), installed: void(0) });
							$api.fp.world.Means.now({
								means: subject.Installation.require.world,
								order: {
									installation: {
										home: tmp.pathname
									},
									version: "3.9.6"
								},
								handlers: captor.handler
							});
							verify(captor).events.length.is(1);
							verify(captor).events[0].type.is("installed");
						}
					);

					fifty.run(
						function() {
							var captor = fifty.$api.Events.Captor({ found: void(0), installed: void(0) });
							$api.fp.world.Means.now({
								means: subject.Installation.require.world,
								order: {
									installation: {
										home: tmp.pathname
									},
									version: "3.9.6"
								},
								handlers: captor.handler
							});
							verify(captor).events.length.is(1);
							verify(captor).events[0].type.is("found");
						}
					);

					fifty.run(
						function() {
							var captor = fifty.$api.Events.Captor({ found: void(0), installed: void(0) });
							$api.fp.world.Means.now({
								means: subject.Installation.require.world,
								order: {
									installation: {
										home: tmp.pathname
									},
									accept: function(version) { return true; },
									version: "3.9.5"
								},
								handlers: captor.handler
							});
							verify(captor).events.length.is(1);
							verify(captor).events[0].type.is("found");
						}
					);

					fifty.run(
						function() {
							var captor = fifty.$api.Events.Captor({ found: void(0), installed: void(0) });
							$api.fp.world.Means.now({
								means: subject.Installation.require.world,
								order: {
									installation: {
										home: tmp.pathname
									},
									version: "3.9.5"
								},
								handlers: captor.handler
							});
							verify(captor).events.length.is(2);
							verify(captor).events[0].type.is("found");
							verify(captor).events[0].detail.evaluate.property("version").is("3.9.6");
							verify(captor).events[1].type.is("installed");
						}
					);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Installation {
			exists: {
				world: slime.$api.fp.world.Sensor<maven.Installation, void, boolean>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Installation.exists = function() {

				}
			}
		//@ts-ignore
		)(fifty);

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;
				const { subject } = test;

				fifty.tests.manual.exists = function() {
					var installation: maven.Installation = {
						home: jsh.shell.environment.MAVEN_HOME
					};

					var exists = $api.fp.world.Sensor.now({
						sensor: subject.Installation.exists.world,
						subject: installation
					});

					jsh.shell.console("Exists: " + installation.home + "?: " + exists);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace exports {
		export interface Installation {
			version: {
				world: slime.$api.fp.world.Sensor<maven.Installation, void, string>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;
				const { subject } = test;

				fifty.tests.manual.version = function() {
					var installation: maven.Installation = {
						home: jsh.shell.environment.MAVEN_HOME
					};

					var version = $api.fp.world.Sensor.now({
						sensor: subject.Installation.version.world,
						subject: installation
					});

					jsh.shell.console("Version: " + installation.home + ": " + version);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	/**
	 * A type representing a potential Maven invocation and providing the ability to specify some common options. This
	 * type can be used in conjunction with `toShellIntention()` to create a
	 * {@link slime.jrunscript.shell.run.Intention shell intention}. If less-common options
	 * need to be passed to Maven, they can be added by post-processing the shell intention.
	 */
	export interface Intention {
		project: string
		properties?: {
			[name: string]: string
		}
		repository?: string
		profiles?: string[]
		settings?: {
			user?: string
			global?: string
		}
		debug?: boolean
		batchMode?: boolean
		commands: string[]
	}

	export interface Exports {
		shell: {
			Intention: (p: {
				javaHome?: string
				installation: Installation
				intention: Intention
			}) => slime.jrunscript.shell.run.Intention
		}
	}

	export interface Exports {
		mvn: any
		Pom: any
		Project: any
		Repository: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}

namespace slime.jsh {
	export interface Tools {
		maven: slime.jrunscript.tools.maven.Exports
	}
}
