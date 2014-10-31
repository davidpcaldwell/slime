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
		return Boolean(jsh.shell && jsh.java.Thread && jsh.ui.javafx && jsh.js.document && jsh.io);
	},
	load: function() {
		var $set = function(v) {
			jsh.ui.javafx.WebView = v;
		};
		$loader.resource = function(path) {
			//	TODO	assumes resource exists
			return new jsh.io.Resource({
				read: {
					binary: function() {
						return jsh.io.java.adapt($loader._stream(path));
					}
				}
			});
		}
		$loader.run("webview.js", {
			$loader: $loader,
			jsh: jsh,
			$set: $set
		});
	}
})