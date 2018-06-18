var URL = "https://services.gradle.org/distributions/gradle-4.8-bin.zip";

jsh.tools.install.install({
	url: URL,
	format: jsh.tools.install.format.zip,
	to: jsh.shell.jsh.lib.getRelativePath("gradle"),
	getDestinationPath: function(file) {
		return "gradle-4.8";
	}
}, {
	console: function(e) {
		jsh.shell.console(e.message);
	}
});
