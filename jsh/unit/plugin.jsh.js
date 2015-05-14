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
		return Boolean(jsh.java && jsh.shell && jsh.unit);
	},
	load: function() {
		jsh.unit.console = {};

		var view = $loader.file("view.js", {
			api: {
				unit: jsh.unit
			}
		});

		var remote = $loader.file("remote.js", {
			api: {
				java: jsh.java,
				unit: jsh.unit
			}
		});

		jsh.unit.console.Stream = function(p) {
			return new view.Console(p);
		};
		jsh.unit.console.subprocess = {};
		jsh.unit.console.subprocess.Remote = remote.Remote;
		jsh.unit.console.subprocess.Parent = remote.Parent;
		jsh.unit.console.subprocess.subprocess = function() {
			return new jsh.unit.JSON.Encoder({
				send: function(s) {
					jsh.shell.echo(s);
				}
			});
		}
		var jshapi = $loader.file("jsapi.js", {
			Scenario: jsh.unit.Scenario,
			html: jsh.unit.html
		});
		jsh.unit.html.Scenario = function(p) {
			return new jshapi.Scenario(p);
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
	}
});

plugin({
	isReady: function() {
		return jsh.js && jsh.shell && jsh.httpd && jsh.unit && jsh.unit.console && jsh.java && jsh.file;
	},
	load: function() {
		var $exports = {};
		$loader.run("plugin.jsh.browser.js", { $exports: $exports, jsh: jsh });
		jsh.unit.browser = $exports;
	}
})