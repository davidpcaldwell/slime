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
			exit: function(status) {
				Packages.java.lang.System.exit(status);
			},
			javafx: $jsh.classpath.getClass("javafx.embed.swing.JFXPanel")
		});
	}
});

plugin({
	isReady: function() {
		return Boolean(jsh.io && jsh.java.log && jsh.ui.javafx && jsh.java.Thread && jsh.js.document);
	},
	load: function() {
		$loader.resource = function(path) {
			//	TODO	assumes resource exists
			return new jsh.io.Resource({
				read: {
					binary: function() {
						var _stream = $loader._stream(path);
						if (!_stream) throw new Error("Not found in " + $loader + ": " + path);
						return jsh.io.java.adapt(_stream);
					}
				}
			});
		}
		$loader.run("webview.js", {
			$loader: $loader,
			$context: {
				log: jsh.java.log.named("rhino.ui.javafx.webview"),
				api: {
					thread: {
						javafx: jsh.ui.javafx.run,
						create: function(f) {
							jsh.java.Thread.start({
								call: f
							});
						}
					},
					document: jsh.js.document
				}
			},
			$set: function(v) {
				jsh.ui.javafx.WebView = v;
			}
		});
	}
});

plugin({
	isReady: function() {
		return jsh.ui && jsh.ui.javafx && jsh.ui.javafx.WebView && jsh.httpd.Tomcat;
	},
	load: function() {
		$loader.run("webview.jsh.api.js", {
			$loader: $loader,
			$set: function(v) {
				jsh.ui.javafx.WebView.application = v;
			}
		});
	}
})