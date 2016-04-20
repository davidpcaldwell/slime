var parameters = jsh.script.getopts({
	options: {
		host: String
	}
});

var h = new jsh.ip.Host({ name: parameters.options.host });
jsh.shell.echo("Reachable (" + parameters.options.host + "): " + h.isReachable());
