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
 *
 * ## Deployment
 *
 * SLIME servlets may be built into ordinary Java web applications, via either the `jsh.httpd.tools` API or via the
 * `rhino/http/servlet/tools/webapp.jsh.js` script.
 *
 * See the documentation for {@link slime.jsh.httpd.Exports | Export["tools"], which can be accessed as `jsh.httpd.tools` }, for how
 * to use the API to build a standard Java webapp.
 *
 * The `webapp.jsh.js` script is a `jsh` script, and takes the following command-line arguments:
 *
 * * **`-to <pathname>`** The pathname to which to build the webapp. If not present, it will be created. If present, it will be deleted and re-created.
 * * **`-recursive`** Whether to create the parent directories of the `-to` pathname if they are not present.
 * * **`-library <name>=<pathname>`** (optional; can be specified multiple times) Specifies the name and location of a Java library to be added to the resulting webapp.
 * * **`-servletapi <pathname>`** (optional if Tomcat is installed in the invoked `jsh`; in that case, the Java servlet API used by Tomcat will be used) The pathname at which the Java Servlet API can be found.
 * * **`-compile <pathname>`** (optional; can be specified multiple times): A pathname under which Java files can be found which should be compiled and added to the webapp.
 * * **`-resources <pathname>`** (can be specified multiple times): The pathname of a <a href="plugin.jsh.resources.api.html#types.resource-mapping-script">resource mapping script</a> that specifies resources to be included in the webapp.
 * * **`-norhino`** Indicates that Mozilla Rhino should not be included in the web application.
 * * **`-servlet <path>`** The path to the SLIME servlet in the context of this web application: in other words, the relative path to the SLIME servlet in the resulting web application directory, based on the mapping specified by the `-resources` argument(s).
 * * **`-parameter <name>=<value>`** Specifies a servlet parameter to use in `web.xml`.
 * * **`-java:version <version>`** (optional) Specifies a target Java version to use when compiling the web application.
 */

//
//	Comment regarding `servlet` property above:
//
//	TODO	this is a lot of indirection. Should we bother trying to reverse-engineer the path from the servlet
//			location or just explain it better?

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
					verify(response).evaluate.property("$loader").is("object");
					verify(response).evaluate.property("$exports").is("object");
					verify(response).evaluate.property("$export").is("function");
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
