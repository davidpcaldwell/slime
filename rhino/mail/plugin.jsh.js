//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.loader.java && jsh.java && jsh.io && jsh.io.mime && jsh.shell;
	},
	load: function() {
		var JAVAMAIL_CLASS = (function() {
			var NAME = "javax.mail.Session";
			var rv = jsh.java.getClass(NAME);
			if (!rv && jsh.shell.jsh.lib && jsh.shell.jsh.lib.getFile("javamail.jar")) {
				jsh.loader.java.add(jsh.shell.jsh.lib.getRelativePath("javamail.jar"));
				rv = jsh.java.getClass(NAME);
			}
			return rv;
		})();
		if (JAVAMAIL_CLASS) {
			jsh.mail = $loader.module("module.js", {
				api: {
					java: jsh.java,
					mime: jsh.io.mime
				}
			});
		}
	}
})