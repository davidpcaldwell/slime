var repository = new jsh.tools.git.Repository({ directory: jsh.script.file.parent.parent.parent });
var configuration = repository.config({
	arguments: ["--list"]
});
jsh.shell.console(JSON.stringify(configuration));

var getConfiguration = function() {
	return repository.config({
		arguments: ["--list"]
	});
};

var requireConfigurationValue = function(name) {
	if (!getConfiguration()[name]) {
		jsh.shell.console("Missing " + name + "; aborting commit and obtaining value from UI.");
		var value = jsh.ui.askpass.gui({
			prompt: "Enter Git configuration value for " + name,
			nomask: true
		});
		repository.config({
			arguments: [name, value]
		});
		jsh.shell.exit(1);
	}
}

requireConfigurationValue("user.name");
requireConfigurationValue("user.email");
