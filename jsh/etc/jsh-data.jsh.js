jsh.shell.echo(JSON.stringify({
	"jsh.script.file": (typeof(jsh.script.file) != "undefined") ? {
		string: jsh.script.file.toString(),
		pathname: {
			string: jsh.script.file.pathname.toString()
		}
	} : void(0),
	"jsh.script.script": (typeof(jsh.script.script) != "undefined") ? {
		string: jsh.script.script.toString(),
		pathname: {
			string: jsh.script.script.pathname.toString()
		}
	} : void(0),
	"jsh.script.url": (typeof(jsh.script.url) != "undefined") ? {
		string: jsh.script.url.toString()
	} : void(0)
}));

