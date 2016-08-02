//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		api: jsh.file.Pathname,
		port: Number,
		"chrome:profile": jsh.file.Pathname,
		debug: false,
		"test:proxy": String
	}
});

var chrome = (function() {
	var profile = (function() {
		if (parameters.options["chrome:profile"]) {
			return parameters.options["chrome:profile"].createDirectory({
				ifExists: function() {
					return false;
				},
				recursive: true
			});
		}
		return jsh.shell.TMPDIR.createTemporary({ directory: true });
	})();
	profile.getRelativePath("First Run").write("", { append: false });
	var chrome = new jsh.shell.browser.chrome.User({ directory: profile });
	return chrome;
})();

//	TODO	undefined parameters.options.api should fail

jsh.ui.browser({
	port: parameters.options.port,
	servlet: {
		pathname: jsh.script.file.parent.getRelativePath("specify/servlet.js")
	},
	parameters: {
		slime: jsh.script.file.parent.parent.parent,
		api: parameters.options.api,
		debug: parameters.options.debug
	},
	browser: function(p) {
		return chrome.run({
			arguments: (function() {
				var rv = [];
				if (parameters.options["test:proxy"]) {
					rv.push("--proxy-pac-url=" + parameters.options["test:proxy"]);
				}
				debugger;
				return rv;
			})(),
			app: p.url
		});
	},
	path: "slime/jsh/unit/specify/index.html"
});
