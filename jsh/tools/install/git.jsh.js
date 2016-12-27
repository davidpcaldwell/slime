if (jsh.shell.os.name == "Mac OS X") {
	if (!jsh.file.Pathname("/Applications/Xcode.app").directory && !jsh.file.Pathname("/Library/Developer/CommandLineTools")) {
		jsh.shell.console("Install Apple's command line developer tools.");
		jsh.shell.run({
			command: "/usr/bin/git"
		});
		jsh.shell.exit(1);
	}
	jsh.shell.console("Git already installed.");
} else {
	throw new Error("Unimplemented: operating system [" + jsh.shell.os.name + "]");
}