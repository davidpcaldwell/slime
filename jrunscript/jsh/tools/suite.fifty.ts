//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.tools.test {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var fixtures = (function() {
				var script: slime.jsh.test.Script = fifty.$loader.script("../../../jrunscript/jsh/fixtures.ts");
				return script().shells(fifty);
			})();

			fifty.tests.suite = function() {
				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });

				var environmentWithJdk = function(now) {
					var jdk = jsh.shell.java.Jdk.from.javaHome();

					var jdkBin = $api.fp.now(jdk, $api.fp.property("base"), jsh.file.Location.from.os, jsh.file.Location.directory.relativePath("bin"));

					var addJavaToPath = function(existing) {
						var pathnames: slime.jrunscript.file.Pathname[] = [];
						pathnames.push(jsh.file.Pathname(jdkBin.pathname));
						pathnames = pathnames.concat(existing.pathnames);
						return jsh.file.Searchpath(pathnames);
					};

					debugger;

					return $api.Object.compose(now, {
						PATH: addJavaToPath(jsh.shell.PATH).toString()
					});
				};

				var builderIntention = fixtures.built(false).invoke({
					script: fifty.jsh.file.relative("slime.jsh.js").pathname,
					arguments: $api.Array.build(function(rv) {
						rv.push(
							"-from", $api.fp.now(
								fixtures.unbuilt().src,
								jsh.file.Location.from.os,
								jsh.file.Location.directory.relativePath("loader/jrunscript/test/data/1"),
								$api.fp.property("pathname")
							),
							"-to", tmp.getRelativePath("1.slime").toString(),
							"version", "1.6"
						)
					}),
					environment: environmentWithJdk
				});

				var builder = $api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: builderIntention
				});
				verify(builder).status.is(0);

				var loaderIntention = fixtures.built(false).invoke({
					script: fifty.jsh.file.relative("../loader/test/1/2.jsh.js").pathname,
					environment: $api.fp.pipe(
						environmentWithJdk,
						function(was) {
							return $api.Object.compose(was, {
								MODULES: tmp.toString()
							})
						}
					)
				});
				var loader = $api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: loaderIntention
				});
				verify(loader).status.is(0);
			}
		}
	//@ts-ignore
	)(fifty);
}
