//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var server = jsh.httpd.Tomcat.serve({
			directory: jsh.shell.jsh.src
		});
		server.start();
		jsh.java.Thread.start(function() {
			server.run();
		});
		var browser = new jsh.shell.browser.chrome.Instance({
			location: jsh.shell.jsh.src.getRelativePath("local/chrome/test")
		});
		browser.run({
			uri: "http://127.0.0.1:" + server.port + "/" + "loader/browser/test/test/nested.html"
		});
	}
)();
