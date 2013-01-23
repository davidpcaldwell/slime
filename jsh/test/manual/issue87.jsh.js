var err = jsh.shell.stderr.character();
jsh.shell.echo("Hello, Long Way! (this works)", { stream: err });
jsh.shell.echo("Hello, World! (this does not work)", { stream: jsh.shell.stderr });
