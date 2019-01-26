try {
	throw new Error("check stack!");
} catch (e) {
	jsh.shell.console(e.stack);
}