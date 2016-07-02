var parameters = jsh.script.getopts({
	options: {	
	}
});

jsh.ui.browser({
	servlet: {
		pathname: jsh.script.file.parent.getRelativePath("specify/servlet.js")
	}
});
