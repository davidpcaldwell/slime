jsh.debug.profile.cpu(jsh.shell);
debugger;
jsh.shell.echo("Hello, World!");
jsh.debug.profile.cpu.dump({
	indent: "  ",
	log: function(s) {
		jsh.shell.echo("PROFILE:" + s);
	}
});
