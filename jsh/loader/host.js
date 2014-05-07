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
	
	var stdio = new function() {
		var out = new Packages.java.io.PrintStream(configuration.getStdio().getStandardOutput());
		var err = new Packages.java.io.PrintStream(configuration.getStdio().getStandardError());
		
		this.getStandardInput = function() {
			return configuration.getStdio().getStandardInput();
		};
		
		this.getStandardOutput = function() {
			return out;
		};
		
		this.getStandardError = function() {
			return err;
		};
	};
	
	this.getStdio = function() {
		return stdio;
	}
	
	this.getPlugins = function(file) {
		return Packages.inonit.script.jsh.Installation.Plugin.get(file);
	}
};
