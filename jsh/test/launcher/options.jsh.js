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

var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src : jsh.script.file.parent.parent.parent.parent;
if (!jsh.unit) {
	jsh.loader.plugins(src.getRelativePath("loader/api"));
	jsh.loader.plugins(src.getRelativePath("jsh/unit"));
	jsh.loader.plugins(src.getRelativePath("jsh/test"));
}
jsh.test.integration({
	scenario: function(parameters) {
		var max = Packages.java.lang.Runtime.getRuntime().maxMemory();
		var half = max / 2;
		this.scenario("-Xmx", {
			create: function() {
				this.execute = function(scope,verify) {
					var forked = jsh.shell.jsh({
						fork: true,
						vmarguments: ["-Xmx"+half.toFixed(0)],
						script: jsh.script.file,
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return Number(result.stdio.output);
						}
					});
					jsh.shell.echo("half = " + half + " forked=" + forked, { stream: jsh.shell.stdio.error });
					verify({},"Subprocess").evaluate(function() {
						return forked < half;
					}).is(true);
				}
			}
		});
	},
	run: function(parameters) {
		jsh.shell.echo(Packages.java.lang.Runtime.getRuntime().maxMemory());
	}
})