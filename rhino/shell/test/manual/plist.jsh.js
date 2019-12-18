var parameters = jsh.script.getopts({
	options: {
		file: jsh.file.Pathname
	}
});

var document = new jsh.document.Document({ file: parameters.options.file.file });
var parsed = new jsh.shell.system.apple.plist.xml.decode(document);
jsh.shell.console(JSON.stringify(parsed,void(0),"    "));

var written = jsh.shell.system.apple.plist.xml.encode(parsed);
jsh.shell.console(written);
