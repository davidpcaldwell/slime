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

//	TODO	is this script still useful? Problem is, adding Rhino to an existing built shell would mean recompiling the jsh.jar
//			launcher. So for a built shell, we need to add it beforehand. Perhaps this script should fail for a built shell and
//			be used for unbuilt shells? Or perhaps for built shells, it should overwrite jsh.jar?
var parameters = jsh.script.getopts({
	options: {
		local: jsh.file.Pathname
	}
});

jsh.shell.echo("Installing Rhino ...");
var operation = "copy";
if (!parameters.options.local) {
	var jrunscript = {
		$api: {
			arguments: ["api"]
		}
	};
	var SRC = (function() {
		if (jsh.shell.jsh.home) return jsh.shell.jsh.home.getRelativePath("jsh.js");
		if (jsh.shell.jsh.src) return jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js");
	})();
	jsh.loader.run(SRC, {}, jrunscript);
	var _rhino = jrunscript.$api.rhino.download();
	parameters.options.local = jsh.file.Pathname(String(_rhino.getCanonicalPath()));
	operation = "move";
}
parameters.options.local.file[operation](jsh.shell.jsh.lib.getRelativePath("js.jar"), { recursive: true });
jsh.shell.echo("Installed Rhino at " + jsh.shell.jsh.lib.getRelativePath("js.jar"));
