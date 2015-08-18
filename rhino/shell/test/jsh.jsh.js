//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (!jsh.unit || !jsh.unit.integration) {
	jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.getRelativePath("loader/api"));
	jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.getRelativePath("jsh/unit"));
	jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.getRelativePath("jsh/test"));
}
jsh.unit.integration({
	scenario: function() {
		var server = jsh.httpd.Tomcat.serve({ directory: jsh.script.file.parent });
		this.scenario(jsh.unit.Suite.Fork({
			name: "HTTP unforked",
			run: jsh.shell.jsh,
			script: jsh.js.web.Url.parse(
				"http://127.0.0.1:" + server.port + "/jsh.jsh.js"
			),
			stdio: {
				output: String,
				error: String
			},
			evaluate: function(result,verify) {
				if (result.status != 2) {
					jsh.shell.echo(result.stdio.output);
					jsh.shell.echo(result.stdio.error);
				}
				verify(result).status.is(2);
				return result;
			}
		}));
		this.scenario(jsh.unit.Suite.Fork({
			name: "HTTP forked",
			fork: true,
			script: jsh.js.web.Url.parse(
				"http://127.0.0.1:" + server.port + "/jsh.jsh.js"
			),
			stdio: {
				output: String,
				error: String
			},
			evaluate: function(result,verify) {
				if (result.status != 2) {
					jsh.shell.echo(result.stdio.output);
					jsh.shell.echo(result.stdio.error);
				}
				verify(result).status.is(2);
				return result;
			}
		}));
	},
	run: function() {
		jsh.shell.exit(2);
	}
});
