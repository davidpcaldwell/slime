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

				fifty.run(fifty.tests.unbuilt);

				fifty.load("launcher.fifty.ts");

				fifty.load("test/suite.fifty.ts");
			}

			fifty.tests.unbuilt = fifty.test.Parent();

			fifty.tests.unbuilt.loaderCache = function() {
				var cache = jsh.shell.jsh.src.getRelativePath("local/jsh/lib/loader").directory;
				if (cache.pathname.java.adapt().exists()) cache.remove();

				var script = fifty.jsh.file.relative("../test/jsh-data.jsh.js").pathname;

				var run = function() {
					var intention = test.shells.unbuilt().invoke({
						script: script,
						stdio: {
							output: "string"
						}
					});
					var result = $api.fp.world.Sensor.now({
						sensor: jsh.shell.subprocess.question,
						subject: intention
					});
					verify(result).status.is(0);
					var data: { shellClasspath: string } = JSON.parse(result.stdio.output);
					return data.shellClasspath;
				}

				var first = run();
				var second = run();
				var expectedPrefix = String(cache.pathname.java.adapt().getCanonicalFile().toURI().toString());
				if (!/\/$/.test(expectedPrefix)) expectedPrefix += "/";

				verify(first).is(second);
				verify(first.substring(0, expectedPrefix.length)).is(expectedPrefix);
				verify(first.substring(expectedPrefix.length)).evaluate(function(path) {
					return /^[0-9a-f]{64}\.\d+\/$/.test(path);
				}).is(true);

				var firstPathname = first.substring("file:".length).replace(/\/$/,"");
				jsh.file.Pathname(firstPathname).directory.getRelativePath(".jsh-loader-cache.json").write(
					"{",
					{ append: false }
				);

				var third = run();
				verify(third).is.not(first);
				verify(third.substring(0, expectedPrefix.length)).is(expectedPrefix);
				verify(third.substring(expectedPrefix.length)).evaluate(function(path) {
					return /^[0-9a-f]{64}\.\d+\/$/.test(path);
				}).is(true);
			}

			fifty.tests.manual = function() {
				const { jsh } = fifty.global;

				jsh.shell.console("jsh = " + jsh.internal.bootstrap["jsh"]);
			}
		}
	//@ts-ignore
	)(fifty);
}
