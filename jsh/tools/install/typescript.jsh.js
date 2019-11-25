if (!jsh.shell.tools.node.run) {
	jsh.shell.tools.node.install();
}
if (!jsh.shell.tools.node.modules.installed["typescript"]) {
	jsh.shell.tools.node.modules.install({ name: "typescript" });
} else {
	jsh.shell.console("TypeScript already installed.");
}
//	TODO	below check does not work and always re-installs
if (!jsh.shell.tools.node.modules.installed["@microsoft/tsdoc"]) {
	jsh.shell.tools.node.modules.install({ name: "@microsoft/tsdoc" });
} else {
	jsh.shell.console("tsdoc already installed.");
}
