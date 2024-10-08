//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jsh.Global & { test: any } } jsh
	 */
	function(Packages,jsh) {
		var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src : jsh.script.file.parent.parent.parent.parent;
		jsh.loader.plugins(src.getRelativePath("jsh/test"));
		//	TODO	remove jsh.test declaration in parameter and declare it for real if it's real
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
							jsh.shell.console("half = " + half + " forked=" + forked);
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
	}
//@ts-ignore
)(Packages,jsh);
