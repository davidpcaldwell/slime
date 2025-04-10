//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(Packages,$api,jsh,$slime,$loader,plugin) {
		plugin({
			load: function() {
				/** @type { slime.jrunscript.ui.Script } */
				var script = $loader.script("module.js");
				var module = script({
					exit: function(status) {
						Packages.java.lang.System.exit(status);
					},
					javafx: Boolean($slime.classpath.getClass("javafx.embed.swing.JFXPanel"))
				});
				jsh.ui = {
					javafx: Object.assign(
						module.javafx || {},
						{
							WebView: void(0)
						}
					),
					askpass: void(0),
					application: void(0),
					object: void(0),
					desktop: void(0),
					configuration: void(0)
				}
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.ui && jsh.shell);
			},
			load: function() {
				/** @type { slime.jsh.Global["ui"]["desktop"]["clipboard"] } */
				var clipboard = void(0);
				if (jsh.shell.os.name == "Mac OS X") {
					clipboard = {
						copy: {
							string: function(string) {
								return function(events) {
									//	For now, going to ignore everything like exit status, etc.; this will basically give us "best
									//	effort" semantics. Could revisit.
									$api.fp.world.now.action(
										jsh.shell.subprocess.action,
										{
											command: "pbcopy",
											stdio: {
												input: string
											}
										}
									)
								}
							}
						}
					};
				}

				jsh.ui.desktop = {
					clipboard: clipboard
				};
			}
		})

		plugin({
			isReady: function() {
				return Boolean(jsh.ui && jsh.java);
			},
			load: function() {
				/** @type { slime.jsh.ui.askpass.Script } */
				var script = $loader.script("askpass.js");
				jsh.ui.askpass = script({
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
				return Boolean(jsh.ui && jsh.ui.javafx && jsh.ui.javafx.WebView && jsh.httpd && jsh.httpd.Tomcat && jsh.java && jsh.shell);
			},
			load: function() {
				/** @type { slime.jsh.ui.internal.application.Script } */
				var script = $loader.script("application.js");

				var api = script({
					library: {
						java: jsh.java,
						shell: jsh.shell
					},
					input: {
						chrome: $api.fp.impure.Input.value(jsh.shell.browser.chrome)
					},
					console: jsh.shell.console,
					jsh: {
						httpd: jsh.httpd,
						ui: jsh.ui
					}
				});

				jsh.ui.application = api.old;
				jsh.ui.object = {
					Application: api.object
				};
				jsh.ui.configuration = api.configuration;
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.ui.configuration && jsh.shell && jsh.shell.tools);
			},
			load: function() {
				jsh.ui.configuration.https = function(p) {
					var tomcat = jsh.shell.tools.mkcert.tomcatConfiguration(p);
					return {
						tomcat: tomcat,
						chrome: {
							hostrules: p.hosts.map(function(host) {
								return "MAP " + host + " 127.0.0.1:" + tomcat.port
							})
						}
					}
				}
			}
		})
	}
//@ts-ignore
)(Packages,$api,jsh,$slime,$loader,plugin)
