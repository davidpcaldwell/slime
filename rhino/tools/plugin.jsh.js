//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	//	TODO	it does not make much sense to check for jsh.shell in .isReady() and then not pass it to the plugin. Is this
	//			method of running the compiler obsolete?
	isReady: function() {
		return typeof(jsh.js) != "undefined" && typeof(jsh.java) != "undefined"
			&& (
				Packages.javax.tools.ToolProvider.getSystemToolClassLoader() != null
				|| jsh.shell && jsh.file.Searchpath([ jsh.shell.java.home.getRelativePath("bin") ]).getCommand("javac")
			)
		;
	},
	load: function() {
		jsh.java.tools = $loader.module("module.js", {
			api: {
				js: jsh.js,
				java: jsh.java
			}
		});
	}
});

plugin({
	isReady: function() {
		return jsh.js && jsh.js.web && jsh.time && jsh.java && jsh.ip && jsh.file && jsh.shell;
	},
	load: function() {
		if (!plugins.slime) plugins.slime = {};
		if (!plugins.slime.tools) plugins.slime.tools = {};
		plugins.slime.tools.hg = $loader.module("hg/module.js", {
			api: {
				js: jsh.js,
				time: jsh.time,
				web: jsh.js.web,
				java: jsh.java,
				ip: jsh.ip,
				file: jsh.file,
				shell: jsh.shell,
			}
		});
		jsh.tools.git = $loader.module("git/module.js", {
			api: {
				js: jsh.js,
				time: jsh.time,
				file: jsh.file,
				shell: jsh.shell
			}
		});
	}
})