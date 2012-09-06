jsh.debug.profile.cpu();
jsh.debug.profile.add(jsh.shell,"jsh.shell");
debugger;
jsh.shell.echo("Hello, World!");
jsh.debug.profile.cpu.dump({
	indent: "  ",
	log: function(s) {
		jsh.shell.echo(s);
	}
});
