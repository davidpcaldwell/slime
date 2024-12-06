//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				api: jsh.file.Pathname,
				"chrome:instance": jsh.file.Pathname,
				debug: false
			}
		});

		//	TODO	undefined parameters.options.api should fail

		jsh.ui.application({
			servlet: {
				file: jsh.script.file.parent.getFile("specify/servlet.js")
			},
			parameters: {
				slime: jsh.script.file.parent.parent.parent,
				api: parameters.options.api,
				debug: parameters.options.debug
			},
			browser: {
				chrome: {
					location: parameters.options["chrome:instance"]
				}
			},
			// browser: function(p) {
			// 	return chrome.run({
			// 		arguments: (function() {
			// 			var rv = [];
			// 			if (parameters.options["test:proxy"]) {
			// 				rv.push("--proxy-pac-url=" + parameters.options["test:proxy"]);
			// 			}
			// 			debugger;
			// 			return rv;
			// 		})(),
			// 		app: p.url
			// 	});
			// },
			path: "slime/loader/api/old/jsh/specify/index.html"
		});
	}
)();
