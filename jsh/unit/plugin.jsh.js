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
		return Boolean(jsh.java && jsh.io && jsh.shell && jsh.unit && jsh.document);
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

		jsh.unit.view.WebView = function() {
			var html = new jsh.document.Document({ string: $loader.resource("webview.html").read(String) });
			var rv = new function() {
				var buffer = [];
				var send;

				var add = function(e) {
					var json = {
						type: e.type,
						detail: e.detail
					};
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

				this.listen = function(scenario) {
					scenario.listeners.add("scenario",add);
					scenario.listeners.add("test",add);
				}
			};
			rv.html = html;
			return rv;
		}

		var html = $loader.file("html.js", {
			Scenario: jsh.unit.Scenario,
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

		jsh.unit.Scenario.Fork = function(p) {
			var buffer = new jsh.io.Buffer();
			if (!p.stdio) p.stdio = {};
			if (p.stdio.output) throw new Error();
			p.stdio.output = buffer.writeBinary();
			jsh.java.Thread.start(function() {
				p.run(p);
				buffer.close();
			});
			return new jsh.unit.Scenario.Stream({ name: p.name, stream: buffer.readBinary() });
		};
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