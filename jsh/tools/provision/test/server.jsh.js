//	When running this program, a server should start and output a command. Running the command should print a Hello, World! message
//	to the console (by simulating the run of the remote script)
//	TODO	test what happens if password typed incorrectly
var parameters = jsh.script.getopts({
	options: {
		host: "127.0.0.1",
		"repository:name": String,
		"repository:location": jsh.file.Pathname,
		"repository:script": String,
		user: "davidpcaldwell",
		password: String
	}
});

var bitbucket = {
	src: {}
};

if (parameters.options["repository:name"]) {
	bitbucket.src[parameters.options.user] = {};
	bitbucket.src[parameters.options.user][parameters.options["repository:name"]] = {
		directory: parameters.options["repository:location"].directory,
		access: {
			user: parameters.options.user,
			password: parameters.options.password
		}
	}
}

var server = new jsh.test.provision.Server({
	bitbucket: bitbucket
});

var mock = {
	server: {
		host: parameters.options.host,
		port: server.port
	}
};

var scripts = {
	standard: "https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/tip/jsh/tools/provision/test/application.jsh.js",
	specified: "https://bitbucket.org/api/1.0/repositories/" + parameters.options.user + "/" + parameters.options["repository:name"] + "/" + "raw/tip/" + parameters.options["repository:script"]
};

jsh.shell.console("Testing (standard):");
jsh.shell.console(new jsh.test.provision.Command({
	mock: mock,
	script: scripts.standard
}));
jsh.shell.console("");
jsh.shell.console("README (standard)");
jsh.shell.console(new jsh.test.provision.Command({
	script: scripts.standard
}));
if (parameters.options["repository:name"]) {
	var user = (parameters.options.password) ? parameters.options.user : null;
	jsh.shell.console("");
	jsh.shell.console("Testing (specified):");
	jsh.shell.console(new jsh.test.provision.Command({
		mock: mock,
		script: scripts.specified,
		user: user
	}));
	jsh.shell.console("");
	jsh.shell.console("README (specified)");
	jsh.shell.console(new jsh.test.provision.Command({
		script: scripts.specified,
		user: user
	}));
}
jsh.shell.console("");
jsh.shell.console("Starting server on port " + server.port + " ...");
server.run();
