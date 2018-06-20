var parameters = jsh.script.getopts({
	options: {
		replace: false,
		version: String,
		nopatch: false
	}
});

jsh.shell.tools.ncdbg.install({
	replace: parameters.options.replace,
	version: parameters.options.version,
	nopatch: parameters.options.nopatch
}, {
	console: function(e) {
		jsh.shell.console(e.detail.message);
	}
});
