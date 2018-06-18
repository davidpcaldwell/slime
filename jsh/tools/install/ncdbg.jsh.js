var parameters = jsh.script.getopts({
	options: {
		replace: false
	}
});

jsh.shell.tools.ncdbg.install({
	replace: parameters.options.replace
});
