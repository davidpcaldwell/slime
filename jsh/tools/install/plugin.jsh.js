//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js && jsh.file && jsh.http && jsh.shell;
	},
	load: function() {
		if (!jsh.tools) jsh.tools = {};
		jsh.tools.install = $loader.module("module.js", {
			api: {
				shell: jsh.shell,
				http: jsh.http,
				file: jsh.file,
				Error: jsh.js.Error
			},
			downloads: jsh.shell.user.downloads
		});
		
		jsh.tools.install.rhino = {};
		jsh.tools.install.rhino.install = function(p) {
			if (!p) p = {};
			if (jsh.shell.jsh.lib.getFile("js.jar") && !p.replace) {
				jsh.shell.console("Rhino already installed at " + jsh.shell.jsh.lib.getFile("js.jar"));
				return;
			}
			jsh.shell.console("Installing Rhino ...");
			var operation = "copy";
			if (!p.local) {
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
				p.local = jsh.file.Pathname(String(_rhino.getCanonicalPath())).file;
				operation = "move";
			}
			p.local[operation](jsh.shell.jsh.lib.getRelativePath("js.jar"), { recursive: true });
			jsh.shell.console("Installed Rhino at " + jsh.shell.jsh.lib.getRelativePath("js.jar"));
		};
		
		jsh.tools.install.tomcat = $loader.file("plugin.jsh.tomcat.js");
	}
});