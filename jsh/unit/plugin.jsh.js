//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	load: function() {
		jsh.$jsapi = {
			$platform: $jsh.$platform,
			$api: $jsh.$api,
			mime: $jsh.mime,
			$rhino: $jsh,
			$coffee: $jsh.coffee,
			java: $jsh.java
		};

	}
});

plugin({
	isReady: function() {
		return Boolean(jsh.java && jsh.io && jsh.shell && jsh.unit);
	},
	load: function() {
		var remote = $loader.file("remote.js", {
			api: {
				java: jsh.java,
				unit: jsh.unit
			}
		});

		jsh.unit.Scenario.Events = function(p) {
			return new remote.Events(p);
		}
		jsh.unit.Scenario.Stream = function(p) {
			return new remote.Stream(p);
		};


		var view = $loader.file("view.js", {
			api: {
				unit: jsh.unit
			}
		});

		jsh.unit.view = {};
		jsh.unit.view.Console = function(p) {
			return new jsh.unit.View(new view.Console(p));
		};
		jsh.unit.view.Events = function(p) {
			return new view.Events(p);
		};
		jsh.unit.view.options = function() {
			var views = {};
			views.console = function() {
				return new jsh.unit.view.Console( { writer: jsh.shell.stdio.error } );
			};
			views.stdio = function() {
				return new jsh.unit.view.Events({ writer: jsh.shell.stdio.output });
			}
			if (jsh.unit.view.WebView) {
				views.webview = function() {
					return new jsh.unit.view.WebView();
				}
			}
			return views;
		};
		jsh.unit.view.options.select = function(name) {
			return jsh.unit.view.options()[name]();
		}
		jsh.unit.interface = {};
		jsh.unit.interface.create = function(suite,o) {
			//	TODO	argument checking
			if (o.view) {
				var view = jsh.unit.view.options.select(o.view);
				view.listen(suite);
				var success = suite.run();
				if (o.view != "webview") {
					jsh.shell.exit( (success) ? 0 : 1 );
				}
			}
		}

		var html = $loader.file("html.js", {
//			Scenario: jsh.unit.Scenario,
//			Suite: jsh.unit.Suite,
			html: jsh.unit.html//,
//			io: jsh.io
		});
		jsh.unit.Scenario.Html = function(p) {
			return new html.Scenario(p);
//			var tests = new jshapi.Tests();
//			if (p.environment) {
//				tests.environment(p.environment);
//			} else {
//				tests.environment({});
//			}
//			p.pages.forEach(function(page) {
//				tests.add({ location: page.pathname });
//			});
//			return tests.toScenario();
		};
		jsh.unit.html.documentation = html.documentation;

//		jsh.unit.Scenario.Fork = function(p) {
//			var buffer = new jsh.io.Buffer();
//			if (!p.stdio) p.stdio = {};
//			if (p.stdio.output) throw new Error();
//			p.stdio.output = buffer.writeBinary();
//			jsh.java.Thread.start(function() {
//				p.run(p);
//				buffer.close();
//			});
//			return new jsh.unit.Scenario.Stream({ name: p.name, stream: buffer.readBinary() });
//		};

		jsh.unit.Suite.Fork = function(p) {
			return {
				create: function() {
					this.name = p.name;

					this.execute = function(scope,verify) {
						var buffer = new jsh.io.Buffer();
						var arg = jsh.js.Object.set({}, p, {
							stdio: {
								output: buffer.writeBinary()
							}
						});
						jsh.java.Thread.start(function() {
							p.run(arg);
							buffer.close();
						});
						var decoder = new remote.Decoder({
							stream: buffer.readBinary(),
							received: function(e) {
								verify.fire(e.type,e.detail);
							}
						});
						decoder.run();
					}
				}
			};
		};

		jsh.unit.Suite.Events = function(p) {
			return {
				create: function() {
					this.name = p.name;

					this.execute = function(scope,verify) {
						p.events.forEach(function(event) {
							verify.fire(event.type,event.detail);
						});
					}
				}
			};
		}

		jsh.unit.Suite.Command = function(p) {
			return {
				create: function() {
					this.name = (function() {
						if (p.name) return p.name;
						if (p.command) return [p.command].concat( (p.arguments) ? p.arguments : [] );
						return "Suite.Command (unnamed)"
					})();

					this.execute = function(scope,verify) {
						var o = {};
						for (var x in p) {
							if (x != "name" && x != "run") {
								o[x] = p[x];
							}
						}
						if (o.evaluate) {
							o.evaluate = (function(was) {
								return function(result) {
									return was.call(null,result,verify);
								}
							})(o.evaluate);
						} else {
							o.evaluate = function(result) {
								verify(result).status.is(0);
							};
						}
						p.run(o);
					}
				}
			};
		}
	}
});

var serializeError = function recurse(e) {
	return {
		name: e.name,
		message: e.message,
		stack: e.stack,
		code: e.code,
		cause: (e.cause) ? recurse(e.cause) : null
	};
};

var serializeEvent = function(e) {
	var json = {
		type: e.type,
		timestamp: e.timestamp,
		detail: e.detail
	};

	var paths = e.path.map(function(source) {
		return source.id;
	});
	json.path = paths;

	if (json.detail.error) {
		json.detail.error = serializeError(json.detail.error);
	}
	return json;
};

plugin({
	isReady: function() {
		//	Need jsh.io for $loader.resource
		return Boolean(jsh.unit && jsh.unit.view && jsh.document && jsh.ui && jsh.ui.javafx && jsh.ui.javafx.WebView && jsh.io);
	},
	load: function() {
		jsh.unit.view.WebView = function() {
//			var $$loader = new jsh.io.Loader($loader.source);
//			jsh.io.decorate($loader);
			var html = new jsh.document.Document({ string: $loader.get("browser/webview.html").string });
			var rv = new function() {
				var buffer = [];
				var send;

				var add = function(e) {
					var json = serializeEvent(e);
					if (send) {
						send(json);
					} else {
						buffer.push(json);
					}
				};

				this.initialize = function(postMessage) {
					send = postMessage;
					for (var i=0; i<buffer.length; i++) {
						send(buffer[i]);
					}
					buffer = null;
				}

				this.view = new jsh.unit.View(add);
			};
			var webview = new jsh.ui.javafx.WebView({
				page: { document: html, loader: new $loader.Child("browser/") },
				initialize: function(p) {
					rv.initialize((function(message) {
						this.postMessage(message);
					}).bind(this));
				}
			});
			jsh.ui.javafx.launch({
				Scene: webview
			});
			return rv.view;
		}
	}
});

plugin({
	isReady: function() {
		return jsh.js && jsh.shell && jsh.httpd && jsh.httpd.Tomcat && jsh.http && jsh.unit && jsh.unit.Scenario.Events && jsh.java && jsh.file;
	},
	load: function() {
		var $exports = {};
		$loader.run("plugin.jsh.browser.js", { $exports: $exports, jsh: jsh });
		jsh.unit.browser = $exports;

		var Chrome = function(p) {
			var location = (p && p.profile) ? p.profile : jsh.shell.TMPDIR.createTemporary({
				directory: true
			}).pathname;
			var directory = location.createDirectory({
				ifExists: function(dir) {
					return false;
				}
			});
			var fr = directory.getRelativePath("First Run");
			if (!fr.file) {
				fr.write("", { append: false });
			}
			var browser = new jsh.shell.browser.chrome.User({ directory: directory });
			var server = new jsh.httpd.Tomcat({
				port: p.port
			});

			var lock = new jsh.java.Thread.Monitor();
			var messages = [];

			var post = new lock.Waiter({
				until: function() {
					return true;
				},
				then: function(e) {
					messages.push(e);
				}
			});

			var get = new lock.Waiter({
				until: function() {
					return true;
				},
				then: function() {
					var rv = messages.map(serializeEvent);
					messages.splice(0,messages.length);
					return rv;
				}
			});

			server.map({
				path: "",
				servlets: {
					"/*": {
						load: function(scope) {
							var server = $loader.module("browser/server.js", {
								suite: p.suite,
								messages: get
							});
							scope.$exports.handle = server.handle;
						},
						$loader: $loader,
						parameters: {}
					}
				},
				resources: {
					loader: $loader,
					Loader: jsh.file.Loader
				}
			});
			server.start();
			browser.launch({
				app: "http://127.0.0.1:" + server.port + "/" + p.page
			});
			return new jsh.unit.View(function(e) {
				post(e);
			});
		};

		jsh.unit.view.Chrome = function(p) {
			return new Chrome(jsh.js.Object.set({}, p, {
				page: "webview.html"
			}));
		};
		jsh.unit.interface.Chrome = function(p) {
			//	expects suite, port, profile, page properties
			var rv = new Chrome(jsh.js.Object.set({}, p, {
				page: "jsh/unit/browser/ui.html"
			}));
			rv.listen(p.suite);
			return rv;
		}
		jsh.unit.interface.create = (function(was) {
			return function(suite,o) {
				if (o.chrome) {
					var p = jsh.js.Object.set({}, { suite: suite }, o.chrome);
					return new jsh.unit.interface.Chrome(p);
				}
				return was.apply(this,arguments);
			}
		})(jsh.unit.interface.create);
	}
})