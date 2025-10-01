//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.internal.launcher {
	export namespace test {
		export const shells = (function(fifty: slime.fifty.test.Kit) {
			var script: slime.jsh.test.Script = fifty.$loader.script("../fixtures.ts");
			var fixtures = script();
			return fixtures.shells(fifty);
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.suite = function() {
				var jshDataScript = fifty.jsh.file.relative("../test/jsh-data.jsh.js").pathname;
				var packaged = test.shells.packaged(jshDataScript);
				var classpathOsLocation = packaged.package;
				var classpathUri = String(jsh.file.Pathname(classpathOsLocation).java.adapt().getCanonicalFile().toURI().toString());
				var intention = packaged.invoke({
					stdio: {
						output: "string"
					}
				});
				var result = $api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: intention
				});
				var data: { shellClasspath: string } = JSON.parse(result.stdio.output);

				verify(data).shellClasspath.is(classpathUri);
			}

			fifty.tests.manual = function() {
				const { jsh } = fifty.global;

				jsh.shell.console("jsh = " + jsh.internal.bootstrap["jsh"]);
			}
		}
	//@ts-ignore
	)(fifty);
}
