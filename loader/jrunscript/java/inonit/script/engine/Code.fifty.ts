//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function(
		Packages: slime.jrunscript.Packages,
		fifty: slime.fifty.test.kit
	) {
		var jsh = fifty.global.jsh;

		fifty.tests.suite = function() {
			var github = Packages.inonit.script.engine.Code.Loader.github(
				new Packages.java.net.URL(
					"https://github.com/davidpcaldwell/slime/archive/refs/heads/master.zip"
				),
				"slime-master/"
			);

			jsh.shell.console("github = " + github);
			var enumerator = github.getEnumerator();
			jsh.shell.console("enumerator = " + enumerator);
			var top = enumerator.list(null);
			jsh.shell.console(top);
			jsh.shell.console(top.length);
			jsh.shell.console("Top level:");
			for (var i=0; i<top.length; i++) {
				jsh.shell.console(top[i]);
			}
			var jshBash = github.getFile("jsh.bash");
			jsh.shell.console("jsh.bash = " + jshBash);
		}
	}
//@ts-ignore
)(Packages,fifty);
