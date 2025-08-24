//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.servlet {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var fixtures: slime.jsh.test.Script = fifty.$loader.script("../../../jrunscript/jsh/fixtures.ts");
			var shells = fixtures().shells(fifty);

			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const COFFEESCRIPT = false;

			//	TODO	standardize; remove duplicate with this exact name in another file
			const environmentWithJavaInPath: slime.$api.fp.Transform<slime.jrunscript.shell.run.Environment> = function(given) {
				var PATH = given.PATH.split(":");
				var home = jsh.shell.java.Jdk.from.javaHome();
				var insert = jsh.file.Pathname(home.base).directory.getRelativePath("bin").toString();
				//var insert = jsh.shell.java.home.getRelativePath("bin").toString();
				jsh.shell.console("Inserting: " + insert);
				PATH.splice(0,0,insert);
				jsh.shell.console("PATH = " + PATH.join(":"));
				return $api.Object.compose(
					given,
					{
						PATH: PATH.join(":")
					}
				)
			};

			var configureTomcatInstallIntoShell = function(src: slime.jrunscript.file.Directory): slime.$api.fp.impure.Output<slime.jrunscript.file.Directory> {
				return function(shell) {
					jsh.shell.jsh({
						shell: shell,
						script: src.getFile("jrunscript/jsh/tools/install/tomcat.jsh.js")
					})
				}
			};

			var installTomcatToShell = configureTomcatInstallIntoShell(
				fifty.jsh.file.object.getRelativePath("../../..").directory
			);

			var requireTomcat = function(home: slime.jrunscript.file.Directory) {
				if (!home.getSubdirectory("lib/tomcat")) {
					installTomcatToShell(home);
				}
			};

			fifty.tests.main = function() {
				requireTomcat(jsh.file.Pathname(shells.built(false).home).directory);

				var intention = shells.built(false).invoke({
					script: fifty.jsh.file.relative("../../../jrunscript/jsh/test/jsh.httpd/httpd.jsh.js").pathname,
					environment: environmentWithJavaInPath
				});

				var result = $api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: intention
				});

				// var result = jsh.shell.jsh({
				// 	shell: environment.jsh.built.home,
				// 	script: environment.jsh.src.getFile("jrunscript/jsh/test/jsh.httpd/httpd.jsh.js")
				// });
				verify(result).status.is(0);
			};

			//	TODO	untested
			if (COFFEESCRIPT) fifty.tests.coffee = function() {
				requireTomcat(jsh.file.Pathname(shells.built(false).home).directory);
				var intention = shells.built(false).invoke({
					script: fifty.jsh.file.relative("../../../jrunscript/jsh/test/jsh.httpd/httpd.jsh.js").pathname,
					arguments: ["-suite", "coffee"],
					environment: environmentWithJavaInPath
				});
				var result = $api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: intention
				});
				verify(result).status.is(0);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.load("server/loader.fifty.ts");

				fifty.load("README.fifty.ts");
				fifty.load("api.fifty.ts");
				fifty.load("plugin.jsh.fifty.ts");
				fifty.load("plugin.jsh.resources.fifty.ts");

				fifty.run(fifty.tests.main);
				if (fifty.tests.coffee) fifty.run(fifty.tests.coffee);
			};
		}
	//@ts-ignore
	)(fifty);
}
