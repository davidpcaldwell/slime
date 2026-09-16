//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.internal.jsapi {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.suite = function() {
				var subprocess = $api.fp.now(
					jsh.shell.subprocess.question,
					$api.fp.world.Sensor.mapping({
						stdout: function(e) {
							jsh.shell.console("jsapi STDOUT: " + e.detail);
						},
						stderr: function(e) {
							jsh.shell.console("jsapi STDERR: " + e.detail);
						}
					})
				);

				var fixtures: slime.runtime.loader.Scoped<void,slime.jsh.test.Exports> = fifty.$loader.script("../jrunscript/jsh/fixtures.ts");

				var shells = fixtures().shells(fifty);

				var result = subprocess({
					command: "bash",
					arguments: $api.Array.build(function(rv) {
						rv.push(fifty.jsh.file.relative("../jsh").pathname);
						rv.push(fifty.jsh.file.relative("jrunscript-jsapi.jsh.js").pathname);
						rv.push("-shell:built", shells.built(false).home);
					})
				});

				verify(result).status.is(0);
			}
		}
	//@ts-ignore
	)(fifty);
}
