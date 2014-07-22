var base = jsh.file.Pathname($parameters.base).directory;
var resources = new jsh.file.Loader({ directory: base });
$exports.handle = function(request) {
	jsh.shell.echo("Got request: " + request.path);
	var resource = resources.resource(request.path);
	jsh.shell.echo("Base is " + base);
	debugger;
	jsh.shell.echo("Resource is " + resource);
	if (resource) {
		return {
			status: { code: 200 },
			body: resource
		}
	} else {
		return {
			status: { code: 404 }
		}
	}
};
