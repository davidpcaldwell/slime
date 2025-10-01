//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Defines basic APIs for serving a project UI; see {@link slime.fifty.view.Exports}. These APIs are used by the `fifty view`
 * command and can also be used to create more complex servers for project UIs.
 */
namespace slime.fifty.view {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			httpd: slime.jsh.httpd.Exports
		}
	}

	/**
	 * Given a project's base directory, creates a server that can serve project files, providing a project UI. The server:
	 *
	 * * Serves TypeDoc from URLs designated for TypeDoc,
	 * * Makes wiki page requests for `local/wiki/pagename` work for `local/wiki/pagename.md` files,
	 * * Serves project files, respecting the `as=text` query parameter to serve them as text.
	 */
	export interface Exports {
		servlet: (p: {
			base: slime.jrunscript.file.Directory
			watch?: boolean
		}) => (httpd: slime.servlet.httpd) => slime.servlet.Script

		server: (p: {
			base: slime.jrunscript.file.Directory
			watch?: boolean
		}) => slime.jsh.httpd.Tomcat
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var code: Script = fifty.$loader.script("view.js");

			fifty.tests.suite = function() {
				if (fifty.global.jsh) {
					var library = code({
						library: {
							file: jsh.file,
							httpd: jsh.httpd
						}
					})

					var base = fifty.jsh.file.object.getRelativePath("../..").directory;
					var server = library.server({ base: base });
					var response = $api.fp.world.now.question(
						jsh.http.world.java.urlconnection,
						jsh.http.Argument.from.request({
							url: "http://127.0.0.1:" + server.port + "/README.html"
						})
					);
					var README = response.stream.character().asString();
					var file = fifty.jsh.file.object.getRelativePath("../../README.html").file.read(String);
					verify(file == README, "README.html served matches file").is(true);
				}
			}
		}
	//@ts-ignore
	)($fifty);

	export type Script = slime.runtime.loader.Module<Context,Exports>
}
