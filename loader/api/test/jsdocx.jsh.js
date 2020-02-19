var parameters = jsh.script.getopts({
	options: {
		"node:debug": false,
		file: jsh.file.Pathname,
		to: jsh.file.Pathname
	}
})

if (jsh.shell.tools.node.install) {
	jsh.shell.tools.node.install();
} else {
	//	For now, not updating; current implementation removes node_modules
	//	jsh.shell.tools.node.update();
}

//	TODO	can next block be modularized?

if (!jsh.shell.tools.node.modules.installed["jsdoc-x"]) {
	jsh.shell.console("jsdoc-x not installed; installing ...");
	jsh.shell.tools.node.modules.install({ name: "jsdoc-x" });
}

jsh.shell.tools.node.run({
	arguments: function(rv) {
		if (parameters.options["node:debug"]) rv.push("--inspect-brk");
		rv.push(jsh.script.file.parent.getRelativePath("jsdocx.node.js"));
		rv.push(parameters.options.file.toString());
		rv.push(parameters.options.to.toString());
	}
});
