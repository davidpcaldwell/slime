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
	var server = new jsh.httpd.Tomcat({
		port: (p.port) ? p.port : void(0)
	});
	var servlet = (function() {
		if (p.servlet.pathname && p.servlet.pathname.file) {
			return { $loader: new jsh.file.Loader({ directory: p.servlet.pathname.file.parent }), path: p.servlet.pathname.basename };
		} else if (p.servlet.$loader) {
			return { $loader: p.servlet.$loader, path: p.servlet.path }
		} else if (p.servlet.resource) {
			var prefix = p.servlet.resource.split("/").slice(0,-1).join("/");
			if (prefix) prefix += "/";
			return { $loader: new p.resources.loader.Child(prefix), path: p.servlet.resource.substring(prefix.length) };
		}
	})();
	server.map({
		path: "",
		servlets: {
			"/*": {
//				file: p.servlet,
				$loader: servlet.$loader,
				parameters: p.parameters,
				load: function(scope) {
					if (p.servlet.scope) {
						p.servlet.scope.call(scope);
					}
					servlet.$loader.run(servlet.path, scope);
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

	var url = "http://127.0.0.1:" + server.port + "/" + ((p.path) ? p.path : "");
	if (!p.browser) {
		//	TODO	add deprecation warning for this
		p.browser = {
			zoom: p.zoom,
			console: p.console
		}
	}
	if (typeof(p.browser) == "object") {
		var addTitleListener = function() {
			this.listeners.add("title", function(e) {
				this._frame.setTitle(e.detail.after);
			});
		};

		jsh.ui.javafx.launch({
			title: "WebView",	//	TODO	default
			Scene: jsh.ui.javafx.WebView({
				page: { url: url },
				//	TODO	configurable
				alert: function(s) {
					jsh.shell.echo("ALERT: " + s);
				},
				//	TODO	configurable
				console: (p.console) ? p.console : new function() {
					this.log = function() {
						jsh.shell.echo("WEBVIEW CONSOLE: " + Array.prototype.slice.call(arguments).join("|"));
					}
				},
				popup: function(_popup) {
					if (!_popup) _popup = this._popup;
					jsh.shell.echo("Creating popup " + _popup + " ...");
					var browser = new Packages.javafx.scene.web.WebView();
					//	TODO	This seems to be a layer higher than it should be; perhaps the lower layer should be creating this
					//			object and calling back into the application layer with it already configured with things like the
					//			zoom level by default
					browser.setZoom(this._browser.getZoom());
					new jsh.ui.javafx.Frame({
						Scene: jsh.ui.javafx.WebView({
							browser: browser,
							initialize: function() {
								addTitleListener.call(this);
							}
						}),
						on: {
							close: function() {
								this.close();
							}
						}
					});
					return browser.getEngine();
				},
				//	TODO	configurable
				initialize: function() {
					addTitleListener.call(this);
				},
				zoom: p.zoom
			}),
			on: p.on
		});
	} else {
		var on = (p.on) ? p.on : {
			close: function() {
				Packages.java.lang.System.exit(0);
			}
		};
		jsh.java.Thread.start(function() {
			p.browser({ url: url });
			on.close();
		});
	}

	return {
		port: server.port
	};
});