//	When running this program, a server should start and output a command. Running the command should print a Hello, World! message
//	to the console (by simulating the run of the remote script)
//	TODO	test what happens if password typed incorrectly
var parameters = jsh.script.getopts({
	options: {
		ip: "127.0.0.1",
		kit: jsh.file.Pathname,
		user: "davidpcaldwell",
		password: String
	}
});
var server = new jsh.test.provision.Server({
	bitbucket: {
		src: {
			davidpcaldwell: {
				"slime-kit": {
					directory: parameters.options.kit.directory,
					access: {
						user: parameters.options.user,
						password: parameters.options.password
					}
				}
			}
		}		
	}
});

var mock = {
	server: {
		ip: parameters.options.ip,
		port: server.port
	}
};

var scripts = {
	open: "https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/tip/jsh/tools/provision/test/application.jsh.js",
	closed: "https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime-kit/raw/tip/test/provision-script.jsh.js"
};

jsh.shell.console("Testing (open):");
jsh.shell.console(new jsh.test.provision.Command({
	mock: mock,
	script: scripts.open
}));
jsh.shell.console("");
jsh.shell.console("README (open)");
jsh.shell.console(new jsh.test.provision.Command({
	script: scripts.open
}));
jsh.shell.console("");
jsh.shell.console("Testing (closed):");
jsh.shell.console(new jsh.test.provision.Command({
	mock: mock,
	script: scripts.closed,
	user: parameters.options.user
}));
jsh.shell.console("");
jsh.shell.console("README (closed)");
jsh.shell.console(new jsh.test.provision.Command({
	script: scripts.closed,
	user: parameters.options.user
}));
jsh.shell.console("");
jsh.shell.console("Starting server on port " + server.port + " ...");
server.run();
