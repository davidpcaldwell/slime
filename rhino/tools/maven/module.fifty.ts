//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.maven {
	export interface Context {
		HOME: slime.jrunscript.file.Directory
		java: slime.jrunscript.shell.Exports["java"]
		mvn: any

		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
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
						shell: jsh.shell
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
				verify(1).is(1);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
