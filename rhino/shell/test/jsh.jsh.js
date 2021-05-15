//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

if (!jsh.test || !jsh.test.integration) {
	//	TODO	can this be implemented for URL-based launches?
	if (jsh.script.file) {
		jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.getRelativePath("loader/api"));
		jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.getRelativePath("jsh/unit"));
		jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.getRelativePath("jsh/test"));
	} else {
		//	URL-based launch, just mock it, essentially
		if (!jsh.test) jsh.test = {};
		jsh.test.integration = function(o) {
			o.run();
		};
	}
}

jsh.test.integration({
	scenario: function() {
		var server = jsh.httpd.Tomcat.serve({ directory: jsh.script.file.parent });
		var url = "http://127.0.0.1:" + server.port + "/jsh.jsh.js";
		this.part("1", {
			name: "HTTP unforked",
			execute: function(scope,verify) {
				jsh.shell.jsh({
					script: jsh.js.web.Url.parse(
						"http://127.0.0.1:" + server.port + "/jsh.jsh.js"
					),
					stdio: {
						output: String,
						error: String
					},
					evaluate: function(result) {
						if (result.status != 2) {
							jsh.shell.echo(result.stdio.output);
							jsh.shell.echo(result.stdio.error);
						}
						var output = JSON.parse(result.stdio.output);
						verify(output).url.is(url);
						verify(result).status.is(2);
						return result;
					}
				});
			}
		});
		this.part("2", {
			name: "HTTP forked",
			execute: function(scope,verify) {
				jsh.shell.jsh({
					fork: true,
					script: jsh.js.web.Url.parse(url),
					stdio: {
						output: String,
						error: String
					},
					evaluate: function(result) {
						if (result.status != 2) {
							jsh.shell.echo(result.stdio.output);
							jsh.shell.echo(result.stdio.error);
						}
						var output = JSON.parse(result.stdio.output);
						verify(output).url.is(url);
						verify(result).status.is(2);
						return result;
					}
				});
			}
		});
	},
	run: function() {
		jsh.shell.echo(JSON.stringify({
			url: (jsh.script.url) ? jsh.script.url.toString() : void(0)
		}));
		jsh.shell.exit(2);
	}
});
