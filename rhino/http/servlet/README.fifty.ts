//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The SLIME servlet implementation allows Java servlets to be authored in JavaScript.
 *
 * SLIME servlets receive the following scope in which to execute:
 *
 * | Name         | Type                                  | Description |
 * | ----         | ------------------------------------- | ----------- |
 * | `$api`       | {@link slime.$api.Global}             | JavaScript utilities. |
 * | `httpd.js`   | {@link slime.$api.old.Exports}        | *Deprecated* Older JavaScript utilities.                   |
 * | `httpd.web`  | {@link slime.web.Exports}             | Web-related constructs (URLs, web forms, percent-encoding) |
 * | `httpd.java` | {@link slime.jrunscript.java.Exports} | Java integration |
 * | `httpd.java` | {@link slime.jrunscript.io.Exports}   | Stream-based I/O based on Java I/O |
 */
namespace slime.servlet {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.scope = fifty.test.Parent();

			fifty.tests.scope._1 = function() {
				var tomcat = jsh.httpd.Tomcat();

				tomcat.map({
					path: "",
					servlets: {
						"/*": {
							file: fifty.jsh.file.object.getRelativePath("test/scope.servlet.js").file
						}
					}
				});

				tomcat.start();

				try {
					var response = new jsh.http.Client().request({
						url: "http://127.0.0.1:" + tomcat.port + "/",
						evaluate: function(response) {
							if (response.status.code != 200) {
								jsh.shell.console(response.body.stream.character().asString());
								throw new Error("Status code: " + response.status.code);
							}
							return JSON.parse(response.body.stream.character().asString());
						}
					});
					verify(response).evaluate.property("foo").is(void(0));
					verify(response).evaluate.property("$api").is.type("object");
					verify(response).evaluate.property("httpd").is.type("object");
					verify(response).evaluate.property("httpd").evaluate.property("js").is.type("object");
					verify(response).evaluate.property("httpd").evaluate.property("web").is.type("object");
					verify(response).evaluate.property("httpd").evaluate.property("java").is.type("object");
					verify(response).evaluate.property("httpd").evaluate.property("io").is.type("object");
				} finally {
					tomcat.stop();
				}
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.scope);
			}
		}
	//@ts-ignore
	)(fifty);
}
