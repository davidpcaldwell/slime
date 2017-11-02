//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.shell && Boolean(jsh.shell.PATH.getCommand("git"));
	},
	load: function() {
		var git = $loader.module("module.js", {
			program: jsh.shell.PATH.getCommand("git")
		});
		git.jsh = {};
		//	TODO	enable credentialHelper for built shells
		//	TODO	investigate enabling credentialHelper for remote shells
		if (jsh.shell.jsh.src) {
			git.jsh.credentialHelper = [
				jsh.shell.java.jrunscript.toString(),
				jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
				"jsh",
				jsh.shell.jsh.src.getRelativePath("rhino/tools/git/credential-helper.jsh.js")
			].join(" ")
		}

		if (!jsh.tools) jsh.tools = {};
		jsh.tools.git = git;
		global.git = git;
		$api.deprecate(global,"git");
	}
})