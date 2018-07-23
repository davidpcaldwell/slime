var toJsonProperty = function(value,formatter) {
	if (typeof(value) == "undefined") return void(0);
	if (value === null) return null;
	return formatter(value);
}

var formatters = {
	directory: function(directory) {
		return {
			pathname: {
				string: directory.pathname.toString()
			},
			string: directory.toString()
		}
	}
};

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
	} : void(0),
	"jsh.shell.jsh.src": toJsonProperty(jsh.shell.jsh.src, formatters.directory),
	"jsh.shell.jsh.home": toJsonProperty(jsh.shell.jsh.home, formatters.directory),
	"jsh.shell.jsh.url": toJsonProperty(jsh.shell.jsh.url, function(url) {
		return {
			string: url.toString()
		}
	})
}));
