var cpu = jsh.debug.profile.cpu(jsh.shell);
debugger;
jsh.shell.echo("Hello, World!");
cpu.dump({
	indent: "  ",
	log: function(s) {
		jsh.shell.echo("PROFILE:" + s);
	}
});
