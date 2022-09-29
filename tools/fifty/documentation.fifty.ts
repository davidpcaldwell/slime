//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.view {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			httpd: slime.jsh.httpd.Exports
		}
	}

	export type Exports = (p: {
		base: slime.jrunscript.file.Directory
		watch?: boolean
	}) => slime.jsh.httpd.Tomcat

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var code: Script = fifty.$loader.script("documentation.js");
			var library = code({
				library: {
					file: jsh.file,
					httpd: jsh.httpd
				}
			})

			fifty.tests.suite = function() {
				var base = fifty.jsh.file.object.getRelativePath("../..").directory;
				var server = library({ base: base });
				var response = $api.Function.world.now.question(
					jsh.http.world.request,
					jsh.http.world.Argument.request({
						url: "http://127.0.0.1:" + server.port + "/README.html"
					})
				);
				var README = response.stream.character().asString();
				var file = fifty.jsh.file.object.getRelativePath("../../README.html").file.read(String);
				verify(file == README, "Matches file").is(true);
			}
		}
	//@ts-ignore
	)($fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
