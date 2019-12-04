var repository = new jsh.tools.git.Repository({ directory: jsh.script.file.parent.parent.parent });
var configuration = repository.config({
	arguments: ["--list"]
});

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
var status = repository.status();
var untracked = (status.paths) ? $api.Object.properties(status.paths).filter(function(property) {
	return property.value == "??"
}).map(function(property) { return property.name; }) : [];
if (untracked.length) {
	jsh.shell.console("Untracked files are present; aborting:");
	jsh.shell.console(untracked.join("\n"));
	jsh.shell.exit(1);
}
if (jsh.shell.environment.SLIME_GIT_HOOK_FAIL) {
	jsh.shell.console("Failing due to present of environment variable SLIME_GIT_HOOK_FAIL.");
	jsh.shell.exit(1);
}
