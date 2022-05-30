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
			const { jsh } = fifty.global;

			fifty.tests.manual = {};

			fifty.tests.manual.viewer = function() {
				var server = new jsh.httpd.Tomcat();
				server.servlet({
					load: function(scope) {
						scope.$exports.handle = scope.httpd.Handler.Loader({
							loader: new jsh.file.Loader({ directory: jsh.shell.jsh.src })
						})
					}
				});
				server.start();

				var browser = jsh.unit.browser.local.Chrome({
					program: jsh.shell.browser.installed.chrome.program,
					user: jsh.shell.jsh.src.getRelativePath("local/chrome/profiler").toString(),
					devtools: false,
					debugPort: 9222
				});

				browser.open({
					uri: "http://127.0.0.1:" + server.port + "/rhino/tools/profiler/viewer/viewer.html?profiles=../../../../local/profiler/profiles.json"
				});
			}
		}
	//@ts-ignore
	)(fifty);

}
