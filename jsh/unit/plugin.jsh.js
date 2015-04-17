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
		jsh.unit.console.Stream = function(p) {
			var api = $loader.file("jsunit.after.js", {
				console: {
					println: function(s) {
						p.writer.write(s + "\n");
					},
					print: function(s) {
						p.writer.write(s);
					}
				}
			});
			return api.console;
		};
		jsh.unit.console.subprocess = $loader.file("console.stdio.js");
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