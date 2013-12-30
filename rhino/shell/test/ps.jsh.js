var ps = jsh.shell.os.process.list();
for (var i=0; i<ps.length; i++) {
	jsh.shell.echo("Process ID: " + ps[i].id + " parent: " + ps[i].parent.id);
	jsh.shell.echo("Command: " + ps[i].command);
	jsh.shell.echo();
}