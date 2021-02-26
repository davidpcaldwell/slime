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

//@ts-check
(
	/**
	 * @param { Packages } Packages
	 * @param { $api } $api
	 * @param { jsh } jsh
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(Packages,$api,jsh,$slime,$loader,plugin) {
		plugin({
			load: function() {
				jsh.ui = $loader.module("module.js", {
					exit: function(status) {
						Packages.java.lang.System.exit(status);
					},
					javafx: $slime.classpath.getClass("javafx.embed.swing.JFXPanel")
				});
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.ui && jsh.java);
			},
			load: function() {
				jsh.ui.askpass = $loader.file("askpass.js", {
					api: {
						java: jsh.java
					}
				});
			}
		})

		plugin({
			isReady: function() {
				return Boolean(jsh.io && jsh.java.log && jsh.ui.javafx && jsh.java.Thread && jsh.js.document);
			},
			load: function() {
				$loader.run("webview.js", {
					$loader: Object.assign($loader, {
						resource: function(path) {
							//	TODO	assumes resource exists
							return $loader.get(path);
						}
					}),
					$context: {
						log: jsh.java.log.named("slime.ui.javafx.webview"),
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
				return Boolean(jsh.ui && jsh.ui.javafx && jsh.ui.javafx.WebView && jsh.httpd && jsh.httpd.Tomcat && jsh.java);
			},
			load: function() {
				var api = $loader.module("application.js", { jsh: jsh });
				(function(v) {
					jsh.ui.javafx.WebView.application = $api.deprecate(v);
					jsh.ui.browser = $api.deprecate(v);
					jsh.ui.application = v;
				})(api.Application);
				jsh.ui.Chrome = api.Chrome;
			}
		})
	}
//@ts-ignore
)(Packages,$api,jsh,$slime,$loader,plugin)
