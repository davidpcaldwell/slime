//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				child: false
			}
		});

		if (parameters.options.child) {
			jsh.shell.echo("Hello, World!");
		} else {
			jsh.shell.echo("Running " + jsh.script.url + " in subshell ...");
			var properties = {};
			//	TODO	would jsh.shell.properties.http work below?
			if (Packages.java.lang.System.getProperty("http.proxyHost")) {
				properties["http.proxyHost"] = String(Packages.java.lang.System.getProperty("http.proxyHost"));
				properties["http.proxyPort"] = String(Packages.java.lang.System.getProperty("http.proxyPort"));
			}
			jsh.shell.jsh({
				fork: true,
				properties: properties,
				script: jsh.script.url,
				arguments: ["-child"]
			});
		}
	}
)();
