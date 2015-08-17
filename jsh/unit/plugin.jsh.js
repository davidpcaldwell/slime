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

		var html = $loader.file("html.js", {
			Scenario: jsh.unit.Scenario,
			Suite: jsh.unit.Suite,
			html: jsh.unit.html,
			io: jsh.io
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
						o.evaluate = function(result) {
							verify(result).status().is(0);
						};
						p.run(o);
					}
				}
			};
		}
	}
});

plugin({
	isReady: function() {
		//	Need jsh.io for $loader.resource
		return Boolean(jsh.unit && jsh.unit.view && jsh.document && jsh.ui && jsh.ui.javafx && jsh.ui.javafx.WebView && jsh.io);
	},
	load: function() {
		jsh.unit.view.WebView = function() {
			jsh.io.decorate($loader);
			var html = new jsh.document.Document({ string: $loader.resource("webview.html").read(String) });
			var rv = new function() {
				var buffer = [];
				var send;

				var add = function(e) {
					var json = {
						type: e.type,
						detail: e.detail
					};

					var errordata = function recurse(e) {
						return {
							name: e.name,
							message: e.message,
							stack: e.stack,
							code: e.code,
							cause: (e.cause) ? recurse(e.cause) : null
						};
					}
					if (json.detail.error) {
						json.detail.error = errordata(json.detail.error);
					}
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
				page: { document: html, loader: $loader },
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
		return jsh.js && jsh.shell && jsh.httpd && jsh.http && jsh.unit && jsh.unit.Scenario.Events && jsh.java && jsh.file;
	},
	load: function() {
		var $exports = {};
		$loader.run("plugin.jsh.browser.js", { $exports: $exports, jsh: jsh });
		jsh.unit.browser = $exports;
	}
})