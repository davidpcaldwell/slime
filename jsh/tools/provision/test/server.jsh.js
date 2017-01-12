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

var writeUrl = function(url,mock) {
	if (mock) url = url.replace(/https:\/\//g, "http://");
	if (mock) url = url.replace(/raw\/tip/g, "raw/local");
	return url;
}

var proxy = function(mock) {
	return "export http_proxy=http://" + mock.server.ip + ":" + mock.server.port;
}

var variables = function(mock) {
	if (mock) return ["INONIT_PROVISION_VERSION=local","INONIT_PROVISION_PROTOCOL=http"]
	return [];
};

var curl = function(closed,mock) {
	return "curl -s -L " + ((closed) ? "-o $TMP_INSTALLER " : "") + writeUrl("https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/tip/jsh/tools/provision/remote.bash",mock);
};

var Command = function(p) {
	this.commands = [];
	if (p.mock) this.commands.push(proxy(p.mock));
	
	this.toString = function() {
		if (this.commands.length > 1) {
			return "(" + this.commands.join(";\n") + ")";
		} else {
			return this.commands[0];
		}
	}
}

var Open = function(p) {
	Command.call(this,p);
	var mockVariables = variables(p.mock).join(" ");
	if (mockVariables) mockVariables += " ";
	this.commands.push(curl(false,p.mock) + " | env " + mockVariables + "INONIT_PROVISION_SCRIPT_JSH=" + writeUrl(p.script,p.mock) + " bash");
}

var Closed = function(p) {
	Command.call(this,p);
	this.commands.push("export TMP_INSTALLER=$(mktemp)");
	this.commands.push("export INONIT_PROVISION_SCRIPT_JSH=" + writeUrl(p.script,p.mock));
	this.commands.push("export INONIT_PROVISION_USER=" + p.user);
	this.commands.push.apply(this.commands,variables(p.mock).map(function(declaration) {
		return "export " + declaration;
	}));
	this.commands.push(curl(true,p.mock));
	this.commands.push("chmod +x $TMP_INSTALLER");
	this.commands.push("$TMP_INSTALLER");
}

var getCommand = function(p) {
	return (p.user) ? new Closed(p) : new Open(p);
}

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
jsh.shell.console(getCommand({
	mock: mock,
	script: scripts.open
}));
jsh.shell.console("");
jsh.shell.console("README (open)");
jsh.shell.console(getCommand({
	script: scripts.open
}));
jsh.shell.console("");
jsh.shell.console("Testing (closed):");
jsh.shell.console(getCommand({
	mock: mock,
	script: scripts.closed,
	user: parameters.options.user
}));
jsh.shell.console("");
jsh.shell.console("README (closed)");
jsh.shell.console(getCommand({
	script: scripts.closed,
	user: parameters.options.user
}));
jsh.shell.console("");
jsh.shell.console("Starting server on port " + server.port + " ...");
server.run();
