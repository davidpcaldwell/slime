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
	 * @param { slime.jsh.ui.internal.application.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jsh.ui.internal.application.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
		var jsh = $context.jsh;
		// TODO: Remove or document (probably by renaming file) dependency on jsh

		/**
		 * @type { slime.$api.fp.Transform<slime.servlet.handler> }
		 */
		var withWebviewInitializeServer = function(was) {
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
				return was.apply(this,arguments);
			}
		};

		/** @type { slime.$api.fp.Transform<slime.jsh.httpd.servlet.DescriptorUsingLoad> } */
		var withWebviewInitialize = function(descriptorUsingLoad) {
			return {
				parameters: descriptorUsingLoad.parameters,
				load: function(scope) {
					descriptorUsingLoad.load(scope);
					scope.$exports.handle = withWebviewInitializeServer(scope.$exports.handle);
				}
			}
		}

		/**
		 * @param { slime.jsh.ui.application.ServerConfiguration } p
		 * @returns { slime.jsh.httpd.servlet.configuration.Servlets }
		 */
		var toServletDescriptor = function(p) {
			var argument = jsh.httpd.spi.servlet.inWebapp(p.resources,p.servlet);
			return jsh.httpd.servlet.Servlets.from.root({
				resources: argument.resources,
				servlet: withWebviewInitialize(argument.servlet)
			});
		}

		/**
		 * @param { slime.jsh.ui.application.ServerConfiguration } p
		 * @returns { slime.jsh.httpd.Tomcat }
		 */
		var Server = function(p) {
			var server = jsh.httpd.Tomcat({
				port: (p.port) ? p.port : void(0),
				https: p.https,
				webapp: toServletDescriptor(p)
			});
			return server;
		};

		/**
		 * @param { slime.jsh.ui.application.ChromeConfiguration } o
		 */
		var Chrome = ($context.input.chrome())
			? (
				/**
				 *
				 * @param { slime.jsh.ui.application.ChromeConfiguration } o
				 * @returns
				 */
				function(o) {
					//	TODO	add location (rather than directory) argument
					return function(p) {
						var lock = new $context.library.java.Thread.Monitor();

						var notify = function() {
							lock.Waiter({
								until: function() {
									return true;
								},
								then: function() {
								}
							})();
						}

						var chrome = $context.input.chrome();

						var instance = new chrome.Instance({
							location: o.location,
							directory: o.directory,
							proxy: p.proxy,
							hostrules: p.hostrules
						});

						var process;
						var finished = false;

						$context.library.java.Thread.start(function() {
							var argument = {
								on: {
									start: function(argument) {
										process = new function() {
											this.close = function() {
												argument.kill();
											};

											this.run = function() {
												return lock.Waiter({
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
							if (o.debug && o.debug.port) {
								argument.debug = o.debug;
							}
							if (o.browser) {
								argument.uri = p.url;
							} else {
								argument.app = p.url;
							}
							instance.run(argument);
							finished = true;
							notify();
						});

						return lock.Waiter({
							until: function() {
								return process;
							},
							then: function() {
								return process;
							}
						})();
					}
				}
			)
			: void(0)
		;

		var javafx = function(settings) {
			return function(p) {
				var addTitleListener = function() {
					this.listeners.add("title", function(e) {
						this._frame.setTitle(e.detail.after);
					});
				};

				var lock = new $context.library.java.Thread.Monitor();
				var closed = false;

				jsh.ui.javafx.launch({
					title: "WebView",	//	TODO	default
					Scene: jsh.ui.javafx.WebView({
						page: { url: p.url },
						//	TODO	configurable
						alert: function(s) {
							$context.console("ALERT: " + s);
						},
						//	TODO	configurable
						console: (settings.browser.console) ? settings.browser.console : new function() {
							//	Satisfy TypeScript
							this.delegee = this.delegee;

							this.toString = function() {
								if (this.delegee) {
									return "WebView console: " + this.delegee.log;
								} else {
									return "WebView console: " + this.log;
								}
							};

							this.log = function() {
								$context.console("WEBVIEW CONSOLE: " + Array.prototype.slice.call(arguments).join("|"));
							}
						},
						popup: function(_popup) {
							if (!_popup) _popup = this._popup;
							$context.console("Creating popup " + _popup + " ...");
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
							lock.Waiter({
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
				lock.Waiter({
					until: function() {
						return closed;
					},
					then: function() {
					}
				})();
			};
		}

		/**
		 * @param { slime.jsh.ui.application.Argument } p
		 * @param { slime.$api.event.Producer } events
		 */
		var Old = function(p,events) {
			/** @type { (v: slime.jsh.ui.application.ServerSpecification) => v is slime.jsh.ui.application.ServerRunning } */
			var isTomcat = function(v) {
				return Boolean(v["server"]);
			}
			var server = (isTomcat(p)) ? p.server : Server(p);
			server.start();
			events.fire("started", server);

			$context.library.java.addShutdownHook(function() {
				server.stop();
			});

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
			if (p.browser.chrome && Chrome) {
				p.browser.create = Chrome(p.browser.chrome);
			}
			/** @type { slime.jrunscript.shell.browser.old.ProxyConfiguration } */
			var proxySettings = (function() {
				if (p.browser.proxy && typeof(p.browser.proxy) == "object") return p.browser.proxy;
				if (p.browser.proxy && typeof(p.browser.proxy) == "function") return p.browser.proxy({ port: server.port });
				if (p.browser.host) return { code: $context.library.shell.browser.ProxyConfiguration.from.host(p.browser.host)(server.port) };
				return null;
			})();
			var proxy = (proxySettings) ? $context.library.shell.browser.ProxyConfiguration(proxySettings) : void(0);
			var url = (function() {
				if (p.url) return p.url;
				var authority = (p.browser.host) ? p.browser.host : "127.0.0.1:" + server.port;
				return "http://" + authority + "/" + ((p.path) ? p.path : "");
			})();
			if (p.browser.create) {
				var browser = p.browser.create({ url: url, proxy: proxy, hostrules: p.browser.chrome.hostrules });
				$context.library.java.Thread.start(function() {
					browser.run();
					server.stop();
					on.close();
				});
			} else {
				if (typeof(p.browser.run) != "function") {
					p.browser.run = javafx(p);
				}
				var run = p.browser.run;
				$context.library.java.Thread.start(function() {
					run({ url: url, proxy: proxy });
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

		/** @type { slime.jsh.ui.internal.application.Exports["object"] } */
		var Application = function(p) {
			return function(events) {
				var server = Server(p.server);
				var network = (p.browser.network) ? p.browser.network({ port: server.port }) : null;
				var proxy = (network) ? $context.library.shell.browser.ProxyConfiguration({ code: network.pac }) : void(0)
				var create = Chrome(p.browser.chrome);
				var url = (function() {
					if (network) return network.url;
					var authority = "127.0.0.1:" + server.port;
					var path = "";
					return "http://" + authority + "/" + path;
				})();
				server.start();
				events.fire("started", server);
				var browser = create({ url: url, proxy: proxy, hostrules: p.browser.chrome.hostrules });
				//	TODO	creates race condition between browser and server
				$context.library.java.Thread.start(function() {
					browser.run();
					server.stop();
					events.fire("close");
				});
				return {
					server: Server(p.server),
					browser: browser
				}
			}
		}

		$export({
			old: $api.events.Function(function(p,events) {
				return Old(p,events);
			}),
			configuration: {
				browser: {
					network: {
						from: {
							host: function(host) {
								return function(p) {
									return {
										url: "http://" + host + "/",
										pac: $context.library.shell.browser.ProxyConfiguration.from.host(host)(p.port)
									}
								}
							}
						}
					}
				}
			},
			object: Application
		});
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export);
