var parameters = jsh.script.getopts({
	options: {
		base: jsh.shell.PWD.pathname
	}
});

var apis = parameters.options.base.directory.list({
	filter: function(node) {
		if (node.directory) return false;
		if (/api\.html$/.test(node.pathname.basename)) return true;
		return false;
	},
	descendants: function(dir) {
		return true;
	}
}).forEach(function(api) {
	jsh.shell.echo("api = " + api);
	var document = new jsh.document.Document({
		string: api.read(String)
	});
	jsh.shell.echo("document = " + document);
});
