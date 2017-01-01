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

var Server = function(p) {
	var server = new jsh.httpd.Tomcat({
		port: (p.port) ? p.port : void(0)
	});
	var servlet = jsh.httpd.spi.argument(p.resources,p.servlet);
	server.map({
		path: "",
		servlets: {
			"/*": {
				parameters: p.parameters,
				load: function(scope) {
					scope.$loader = servlet.$loader;
					servlet.load.apply(this,arguments);
					scope.$exports.handle = (function(declared) {
						return function(request) {
							if (request.path == "webview.initialize.js") {
								var code = $loader.get("webview.initialize.js").read(String);
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
		resources: servlet.resources
	});
	return server;
};

var Chrome = function(o) {
	//	TODO	add location (rather than directory) argument
	return function(p) {
		var lock = new jsh.java.Thread.Monitor();

		var notify = function() {
			new lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
				}
			})();
		}

		var instance = new jsh.shell.browser.chrome.Instance({ 
			location: o.location,
			directory: o.directory,
			proxy: p.proxy 
		});

		var process;
		var finished = false;

		jsh.java.Thread.start(function() {
			var argument = {
				on: {
					start: function(argument) {
						process = new function() {
							this.close = function() {
								argument.kill();
							};

							this.run = function() {
								return new lock.Waiter({
									until: function() {
										return finished;
									},
									then: function() {
									}
								})();
							};
						};
						notify();
					}
				}
			};
			if (o.browser) {
				argument.uri = p.url;
			} else {
				argument.app = p.url;
			}
			instance.run(argument);
			finished = true;
			notify();
		});

		return new lock.Waiter({
			until: function() {
				return process;
			},
			then: function() {
				return process;
			}
		})();
	}
};

var javafx = function(settings) {
	return function(p) {
		var addTitleListener = function() {
			this.listeners.add("title", function(e) {
				this._frame.setTitle(e.detail.after);
			});
		};

		var lock = new jsh.java.Thread.Monitor();
		var closed = false;

		jsh.ui.javafx.launch({
			title: "WebView",	//	TODO	default
			Scene: jsh.ui.javafx.WebView({
				page: { url: p.url },
				//	TODO	configurable
				alert: function(s) {
					jsh.shell.console("ALERT: " + s);
				},
				//	TODO	configurable
				console: (settings.browser.console) ? settings.browser.console : new function() {
					this.toString = function() {
						if (this.delegee) {
							return "WebView console: " + this.delegee.log;
						} else {
							return "WebView console: " + this.log;
						}
					};

					this.log = function() {
						jsh.shell.console("WEBVIEW CONSOLE: " + Array.prototype.slice.call(arguments).join("|"));
					}
				},
				popup: function(_popup) {
					if (!_popup) _popup = this._popup;
					jsh.shell.console("Creating popup " + _popup + " ...");
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
				zoom: settings.browser.zoom
			}),
			on: {
				close: function(p) {
					new lock.Waiter({
						until: function() {
							return true;
						},
						then: function() {
							closed = true;
						}
					})();
				}
			}
		});
		new lock.Waiter({
			until: function() {
				return closed;
			},
			then: function() {
			}
		})();
	};
}

var Application = function(p) {
	var server = (p.server) ? p.server : Server(p);
	server.start();

	var stopServer = new JavaAdapter(
		Packages.java.lang.Runnable,
		new function() {
			this.run = function() {
				server.stop();
			}
		}
	);

	Packages.java.lang.Runtime.getRuntime().addShutdownHook(new Packages.java.lang.Thread(stopServer));

	var on = (p.on) ? p.on : {
		close: function() {
			Packages.java.lang.System.exit(0);
		}
	};

	if (!p.browser) {
		$api.deprecate(function() {
			p.browser = {
				zoom: p.zoom,
				console: p.console
			}
		})()
	}
	if (typeof(p.browser) == "function") {
		p.browser = $api.deprecate(function(implementation) {
			return {
				run: function(p) {
					implementation(p);
				}
			}
		})(p.browser);
	}
	if (p.browser.chrome) {
		p.browser.create = Chrome(p.browser.chrome);
	}
	var proxySettings = (function() {
		if (p.browser.proxy && typeof(p.browser.proxy) == "object") return p.browser.proxy;
		if (p.browser.proxy && typeof(p.browser.proxy) == "function") return p.browser.proxy({ port: server.port });
		if (p.browser.host) return { port: server.port };
		return null;
	})();
	var proxy = (proxySettings) ? new jsh.shell.browser.ProxyConfiguration(proxySettings) : void(0);
	var authority = (p.browser.host) ? p.browser.host : "127.0.0.1:" + server.port;
	var url = "http://" + authority + "/" + ((p.path) ? p.path : "");
	if (p.browser.create) {
		var browser = p.browser.create({ url: url, proxy: proxy });
		jsh.java.Thread.start(function() {
			browser.run();
			server.stop();
			on.close();
		});
	} else {
		if (typeof(p.browser.run) != "function") {
			p.browser.run = javafx(p);
		}
		jsh.java.Thread.start(function() {
			p.browser.run({ url: url, proxy: proxy });
			server.stop();
			on.close();
		});
	}

	return {
		port: server.port,
		server: server,
		browser: browser
	};
};

$exports.Application = Application;
