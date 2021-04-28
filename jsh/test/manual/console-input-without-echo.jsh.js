//	This test presently does not work as intended -- the characters that are not supposed to echo echo.
//
jsh.shell.run({
	command: jsh.script.file.parent.getFile("console-input-without-echo.bash"),
	stdio: {
		input: jsh.shell.stdio.input
	}
});
