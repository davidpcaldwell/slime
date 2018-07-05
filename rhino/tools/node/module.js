$exports.Installation = function(o) {
	this.toString = function() {
		return "Node installation at " + o.directory;
	};
	
	this.npm = function(p) {
		var elements = jsh.shell.PATH.pathnames.slice();
		elements.push(o.directory.getRelativePath("bin"));
		var PATH = jsh.file.Searchpath(elements);
		jsh.shell.run({
			command: o.directory.getFile("bin/npm"),
			arguments: (function(rv) {
				rv.push(p.command);
				rv.push.apply(rv,p.arguments);
				return rv;
			})([]),
			environment: jsh.js.Object.set({}, jsh.shell.environment, {
				PATH: PATH.toString()
			}),
			directory: p.project
		});
	}
};
