jsh.tools.install.install({ 
	url: "https://archive.apache.org/dist/poi/release/bin/poi-bin-4.0.0-20180907.tar.gz",
	to: jsh.shell.jsh.lib.getRelativePath("poi"),
	getDestinationPath: function(file) {
		return "poi-4.0.0";
	}
}, {
	console: function(e) {
		jsh.shell.console(e.detail);
	}
});
