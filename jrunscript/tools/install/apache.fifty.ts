//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.install.apache {
	export interface Context {
		client: slime.jrunscript.http.client.object.Client
		downloads: slime.jrunscript.file.Directory
		get: slime.jrunscript.tools.install.Exports["get"]
	}

	export interface Exports {
		find: slime.jrunscript.tools.install.Exports["apache"]["find"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.manual = {};

			fifty.tests.manual.tomcat = function() {
				var downloads = fifty.jsh.file.object.temporary.directory();

				const module = (() => {
					const script: slime.jrunscript.tools.install.Script = fifty.$loader.script("module.js");

					//	TODO	a lot of copy-paste from module.fifty.ts in fixtures; probably should go to separate fixtures.ts

					var defaults: slime.jrunscript.tools.install.Context = {
						library: {
							shell: jsh.shell,
							http: jsh.http,
							file: jsh.file,
							web: jsh.web,
							install: jsh.java.tools
						},
						downloads: downloads
					};

					const api = script(defaults);

					return api;
				})();

				const subject = (() => {
					const script: Script = fifty.$loader.script("apache.js");
					return script({
						client: new jsh.http.Client(),
						get: module.get,
						downloads: downloads
					})
				})();

				const majorVersion = 9;
				const version = "9.0.105";
				//	TODO	better API for displaying current date
				var start = jsh.time.Value.now();
				jsh.shell.console("Downloading to " + downloads + " at " + String(new Date(start)) + " ...");
				var found = $api.fp.world.Question.now({
					question: subject.find({
						path: "tomcat/tomcat-" + majorVersion + "/v" + version + "/bin/apache-tomcat-" + version + ".zip"
					}),
					handlers: {
						console: $api.fp.pipe($api.fp.property("detail"), jsh.shell.console)
					}
				});
				var end = jsh.time.Value.now();
				jsh.shell.console("Done with download to " + found.pathname.toString() + " after " + ( (end - start) / 1000 ).toFixed(3) + " seconds.");
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.runtime.loader.Module<Context,Exports>
}
