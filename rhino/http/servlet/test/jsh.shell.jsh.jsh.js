//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (!jsh.unit || !jsh.unit.integration) {
	jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.parent.getRelativePath("loader/api"));
	jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.parent.getRelativePath("jsh/unit"));
	jsh.loader.plugins(jsh.script.file.parent.parent.parent.parent.parent.getRelativePath("jsh/test"));
}
jsh.unit.integration({
	scenario: function() {
		this.add({
			scenario: new function() {
				this.execute = function(scope) {
					var verify = new jsh.unit.Verify(scope);
					var directory = jsh.shell.TMPDIR.createTemporary({ directory: true });
					directory.getRelativePath("a").write("a", { append: false });
					var tomcat = jsh.httpd.Tomcat.serve({
						directory: directory
					});
					var client = new jsh.http.Client();
					var response = client.request({
						url: "http://127.0.0.1:" + tomcat.port + "/" + "a"
					});
					var content = response.body.stream.character().asString();
					verify(response).status.code.is(200);
					verify(content).is("a");
					var response = client.request({
						url: "http://127.0.0.1:" + tomcat.port + "/" + "b"
					});
					verify(response).status.code.is(404);
				}
			}
		})
	}
})
