if (!jsh.shell.tools.node.run) {
	jsh.shell.tools.node.install();
}
if (!jsh.shell.tools.node.modules.installed["typescript"]) {
	jsh.shell.tools.node.modules.install({ name: "typescript" });
} else {
	jsh.shell.console("TypeScript already installed.");
}
