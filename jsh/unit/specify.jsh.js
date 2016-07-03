var parameters = jsh.script.getopts({
	options: {
		api: jsh.file.Pathname
	}
});

var chrome = (function() {
	var profile = jsh.shell.TMPDIR.createTemporary({ directory: true });
	profile.getRelativePath("First Run").write("", { append: false });
	var chrome = new jsh.shell.browser.chrome.User({ directory: profile });
	return chrome;
})();

//	TODO	undefined parameters.options.api should fail

jsh.ui.browser({
	servlet: {
		pathname: jsh.script.file.parent.getRelativePath("specify/servlet.js")
	},
	parameters: {
		api: parameters.options.api
	},
	browser: function(p) {
		return chrome.run({
			app: p.url
		});
	}
});
