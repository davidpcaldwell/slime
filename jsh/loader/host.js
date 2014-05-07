var $host = new function() {
	var installation = $shell.getInstallation();
	var configuration = $shell.getConfiguration();	
	var invocation = $shell.getInvocation();
	
	var loader;
	
	this.getRhinoLoader = function() {
		return $engine.$javaloader;
	};
	
	this.getEnvironment = function() {
		return configuration.getEnvironment();
	};
	
	this.getSystemProperties = function() {
		return configuration.getSystemProperties();
	}
	
	this.getPlugins = function(file) {
		return Packages.inonit.script.jsh.Installation.Plugin.get(file);
	}
};
