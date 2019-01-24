//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//jsh.loader.plugins(jsh.script.file.parent.parent);

var SLIME = jsh.script.file.parent.parent.parent.parent;

jsh.test.integration({
	getopts: {
		options: {
			jdk: jsh.file.Pathname
		}
	},
	scenario: function(parameters) {
		this.add({
			scenario: new function() {
				this.execute = function(scope) {
					var verify = new jsh.unit.Verify(scope);
					var JSH = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var args = [JSH];
					if (jsh.shell.rhino && jsh.shell.rhino.classpath) {
						args.push("-rhino", jsh.shell.rhino.classpath);
					} else {
						args.push("-norhino");
					}
					args.push("-notest");
					args.push("-nodoc");
					jsh.shell.jsh({
						fork: true,
						script: SLIME.getFile("jsh/etc/build.jsh.js"),
						arguments: args
					});
					verify(1).is(1);
					var args = [];
					args.push(JSH.getFile("jsh.js"));
					args.push(SLIME.getFile("jsh/test/jsh-data.jsh.js"));
					jsh.shell.run({
						command: jsh.file.Searchpath([parameters.options.jdk.directory.getRelativePath("bin")]).getCommand("jrunscript"),
						arguments: args,
						evaluate: function(result) {
							verify(result).status.is(0);
						}
					});
				}
			}
		})
	},
	run: function(parameters) {
		jsh.shell.echo("Hello, World!");
	}
});
