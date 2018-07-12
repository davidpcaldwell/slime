$exports.Installation = function(o) {
	this.toString = function() {
		return "Node installation at " + o.directory;
	};
	
	var PATH = (function() {
		var elements = jsh.shell.PATH.pathnames.slice();
		elements.push(o.directory.getRelativePath("bin"));
		return jsh.file.Searchpath(elements);		
	})();
	
	this.run = function(p) {
		jsh.shell.run({
			command: p.project.getFile("node_modules/.bin/" + p.command),
			arguments: p.arguments,
			environment: jsh.js.Object.set({}, jsh.shell.environment, p.environment, {
				PATH: PATH.toString()
			})
		});
	}
	
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
			environment: jsh.js.Object.set({}, jsh.shell.environment, p.environment, {
				PATH: PATH.toString()
			}),
			directory: p.project
		});
	}
};
