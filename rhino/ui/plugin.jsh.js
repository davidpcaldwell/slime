//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME Java GUI module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	load: function() {
		jsh.ui = $loader.module("module.js", {
			javafx: $jsh.classpath.getClass("javafx.embed.swing.JFXPanel")
		});
	}
});

plugin({
	isReady: function() {
		return Boolean(jsh.java.tools && jsh.shell && jsh.loader.java && jsh.script && jsh.ui.javafx && jsh.java.Thread && jsh.js.document);
	},
	load: function() {
		var $set = function(v) {
			jsh.ui.javafx.WebView = v;
		};
		$loader.run("webview.js", {
			jsh: jsh,
			$set: $set
		});
	}
})