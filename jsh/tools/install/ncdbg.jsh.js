var parameters = jsh.script.getopts({
	options: {
		replace: false,
		version: String
	}
});

jsh.shell.tools.ncdbg.install({
	replace: parameters.options.replace,
	version: parameters.options.version
}, {
	console: function(e) {
		jsh.shell.console(e.detail.message);
	}
});
