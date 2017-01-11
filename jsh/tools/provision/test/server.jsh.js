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
var server = new jsh.test.mock.Internet();
server.add(jsh.test.mock.Internet.bitbucket({
	src: {
		davidpcaldwell: {
			slime: {
				directory: jsh.shell.jsh.src,
				downloads: {
					"jdk-8u112-macosx-x64.dmg": jsh.shell.user.downloads.getFile("jdk-8u112-macosx-x64.dmg")
				}
			},
			"slime-kit": {
				directory: parameters.options.kit.directory,
				access: {
					user: parameters.options.user,
					password: parameters.options.password
				}
			}
		}
	}
}));

var ip = parameters.options.ip;
jsh.shell.console("Starting server on port " + server.port + " ...");

var writeUrl = function(url,mock) {
	if (mock) url = url.replace(/https:\/\//g, "http://");
	if (mock) url = url.replace(/raw\/tip/g, "raw/local");
	return url;
}

var proxy = "export http_proxy=http://" + ip + ":" + server.port;

var versions = function(mock) {
	if (mock) return ["INONIT_PROVISION_VERSION=local"]
	return [];
};

var curl = function(closed,mock) {
	return "curl -s -L " + ((closed) ? "-o $TMP_INSTALLER " : "") + writeUrl("https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/tip/jsh/tools/provision/remote.bash",mock);
};

var script = function(mock) {
	return "INONIT_PROVISION_SCRIPT_JSH=" + writeUrl()
}

var Command = function(mock) {
	this.commands = [];
	if (mock) this.commands.push(proxy);
	
	this.toString = function() {
		if (this.commands.length > 1) {
			return "(" + this.commands.join(";\n") + ")";
		} else {
			return this.commands[0];
		}
	}
}

var Open = function(mock) {
	Command.call(this,mock);
	this.commands.push(curl(false,mock) + " | env " + versions(mock).join(" ") + " INONIT_PROVISION_SCRIPT_JSH=" + writeUrl("https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/tip/jsh/tools/provision/test/application.jsh.js",mock) + " bash");
}

var Closed = function(mock) {
	Command.call(this,mock);
	this.commands.push("export TMP_INSTALLER=$(mktemp)");
	this.commands.push("export INONIT_PROVISION_SCRIPT_JSH=" + writeUrl("https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime-kit/raw/tip/test/provision-script.jsh.js",mock));
	this.commands.push("export INONIT_PROVISION_USER=" + parameters.options.user);
	this.commands.push.apply(this.commands,versions(mock).map(function(declaration) {
		return "export " + declaration;
	}));
	this.commands.push(curl(true,mock));
	this.commands.push("chmod +x $TMP_INSTALLER");
	this.commands.push("$TMP_INSTALLER");
}

jsh.shell.console("Testing (open):");
jsh.shell.console(new Open(true));
jsh.shell.console("");
jsh.shell.console("Testing (closed):");
jsh.shell.console(new Closed(true));
jsh.shell.console("");
jsh.shell.console("README (open)");
jsh.shell.console(new Open(false));
jsh.shell.console("");
jsh.shell.console("README (closed)");
jsh.shell.console(new Closed(false));
jsh.shell.console("");
server.run();
