var parameters = jsh.script.getopts({
	options: {
		api: jsh.file.Pathname,
		port: Number,
		"chrome:profile": jsh.file.Pathname,
		debug: false
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
			app: p.url
		});
	},
	path: "slime/jsh/unit/specify/index.html"
});
