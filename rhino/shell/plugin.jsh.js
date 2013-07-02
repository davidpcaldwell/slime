plugin({
	isReady: function() {
		return jsh.js && jsh.java && jsh.io && jsh.file;
	},
	load: function() {
		var $shell = plugins.$jsh.shell;
		
		var context = {};
		context.api = {
			js: jsh.js,
			java: jsh.java,
			shell: $shell,
			io: jsh.io,
			file: jsh.file
		}
		context.stdio = new function() {
			this["in"] = jsh.io.java.adapt($host.getStdio().getStandardInput());
			this["out"] = jsh.io.java.adapt($host.getStdio().getStandardOutput());
			this["err"] = jsh.io.java.adapt($host.getStdio().getStandardOutput());
		}
		context.getSystemProperty = function(name) {
			var rv = $host.getSystemProperties().getProperty(name);
			if (rv == null) return null;
			return String(rv);
		};
		context._getSystemProperties = function() {
			return $host.getSystemProperties();
		};
		context.exit = function(code) {
			$host.exit(code);
		}
		jsh.shell = $loader.file("jsh.js", context);
	}
})