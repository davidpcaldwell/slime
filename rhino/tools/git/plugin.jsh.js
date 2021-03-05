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

//	TODO	Note that under normal circumstances this file will never be used; the plugin.jsh.js in the parent directory will
//			be processed and stop the search for plugins. This plugin is left in place because callers might potentially attempt
//			to locate it explicitly
plugin({
	isReady: function() {
		return jsh.js && jsh.time && jsh.js.web && jsh.java && jsh.ip && jsh.file && jsh.shell && jsh.tools && jsh.tools.install && jsh.java.tools;
	},
	load: function() {
		jsh.tools.git = $loader.module("module.js", {
			api: {
				js: jsh.js,
				java: {
					Thread: jsh.java.Thread
				},
				time: jsh.time,
				file: jsh.file,
				shell: jsh.shell,
				ip: jsh.ip,
				Events: {
					//	TODO	convert to standard form and get rid of this
					Function: jsh.tools.install.$api.Events.Function
				},
				Error: jsh.js.Error
			}
		});
		if (jsh.tools.git.installation) {
			//	TODO	enable credentialHelper for built shells
			//	TODO	investigate enabling credentialHelper for remote shells
			if (jsh.shell.jsh.src) {
				var credentialHelper = [
					jsh.shell.java.jrunscript.toString(),
					jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
					"jsh",
					jsh.shell.jsh.src.getRelativePath("rhino/tools/git/credential-helper.jsh.js")
				].join(" ");
				jsh.tools.git.credentialHelper.jsh = credentialHelper;
			}

			global.git = {};
			["Repository","init"].forEach(function(name) {
				global.git[name] = jsh.tools.git[name];
				$api.deprecate(global.git,name);
			});
			$api.deprecate(global,"git");
		}
	}
})