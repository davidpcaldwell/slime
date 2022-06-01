//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.profiler.viewer {
	export interface Settings {
		threshold: number
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.manual = {};

			fifty.tests.manual.json = function() {
				jsh.shell.world.run(
					jsh.shell.Invocation.create({
						command: jsh.shell.jsh.src.getRelativePath("jsh.bash").toString(),
						arguments: $api.Array.build(function(rv) {
							rv.push(jsh.shell.jsh.src.getRelativePath("jsh/tools/profile.jsh.js"));
							rv.push("--profiler:output:json", jsh.shell.jsh.src.getRelativePath("local/profiler/profiles.json"));
							rv.push(jsh.shell.jsh.src.getRelativePath("jsh/test/jsh-data.jsh.js"));
						})
					})
				)();
			}

			fifty.tests.manual.viewer = function() {
				fifty.tests.manual.json();
				var server = new jsh.httpd.Tomcat();
				server.servlet({
					load: function(scope) {
						scope.$exports.handle = scope.httpd.Handler.Loader({
							loader: new jsh.file.Loader({ directory: jsh.shell.jsh.src })
						})
					}
				});
				server.start();

				//	TODO	this somewhat awkward series of API calls is caused by using the unit testing browser implementation,
				//			which has a simpler API, rather than using the Chrome API directly. Should revisit.
				var browser = jsh.unit.browser.local.Chrome({
					program: jsh.shell.browser.installed.chrome.program,
					user: jsh.shell.jsh.src.getRelativePath("local/chrome/profiler").toString(),
					devtools: false,
					debugPort: 9222
				});

				browser.open({
					uri: "http://127.0.0.1:" + server.port + "/rhino/tools/profiler/viewer/viewer.html?profiles=../../../../local/profiler/profiles.json"
				});
				server.run();
			}
		}
	//@ts-ignore
	)(fifty);

}
