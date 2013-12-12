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
	isReady: function() {
		return typeof(jsh.js) != "undefined" && typeof(jsh.java) != "undefined" 
			&& (
				Packages.javax.tools.ToolProvider.getSystemToolClassLoader() != null
				|| jsh.file.Searchpath([ jsh.shell.java.home.getRelativePath("bin") ]).getCommand("javac")
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
})