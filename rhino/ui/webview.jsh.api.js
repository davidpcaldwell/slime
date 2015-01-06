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

$set(function(p) {
	var server = new jsh.httpd.Tomcat({});
	server.map({
		path: "/",
		servlets: {
			"/*": {
//				file: p.servlet,
				$loader: p.servlet.$loader,
				parameters: p.parameters,
				load: function(scope) {
					p.servlet.$loader.run(p.servlet.path, scope);
					scope.$exports.handle = (function(declared) {
						return function(request) {
							if (request.path == "webview.initialize.js") {
								var code = $loader.resource("webview.initialize.js").read(String);
								return {
									status: {
										code: 200
									},
									body: {
										type: "text/javascript",
										string: code
									}
								}
							}
							return declared.apply(this,arguments);
						}
					})(scope.$exports.handle);
				}
			}
		},
		resources: p.resources
	});
	server.start();

	var stopTomcat = new JavaAdapter(
		Packages.java.lang.Runnable,
		new function() {
			this.run = function() {
				server.stop();
			}
		}
	);

	Packages.java.lang.Runtime.getRuntime().addShutdownHook(new Packages.java.lang.Thread(stopTomcat));

	jsh.ui.javafx.launch({
		title: "WebView",	//	TODO	default
		Scene: jsh.ui.javafx.WebView({
			page: { url: "http://127.0.0.1:" + server.port + "/" + ((p.path) ? p.path : "") },
			//	TODO	configurable
			alert: function(s) {
				jsh.shell.echo("ALERT: " + s);
			},
			popup: function(_popup) {
				if (!_popup) _popup = this._popup;
				jsh.shell.echo("Creating popup " + _popup + " ...");
				var view = new Packages.javafx.scene.web.WebView();
				var frame = new jsh.ui.javafx.Frame({
					Scene: jsh.ui.javafx.WebView({
						initialize: function() {
							jsh.shell.echo("Popup initialized ...");
						}
					}),
					on: {
						close: function() {
							this.close();
						}
					}
				});
				return view.getEngine();
			},
			//	TODO	configurable
			console: new function() {
				this.log = function(s) {
					jsh.shell.echo("CONSOLE: " + s);
				}
			},
			//	TODO	configurable
			initialize: function() {
				this.listeners.add("title", function(e) {
					this._frame.setTitle(e.detail.after);
				});
			}
		})
	});

	return {
		port: server.port
	};
});