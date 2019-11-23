if (!jsh.shell.tools.node.run) {
	jsh.shell.tools.node.install();
}
if (!jsh.shell.tools.node.modules.installed["eslint"]) {
	jsh.shell.tools.node.modules.install({ name: "eslint" });
} else {
	jsh.shell.console("ESLint already installed.");
}
