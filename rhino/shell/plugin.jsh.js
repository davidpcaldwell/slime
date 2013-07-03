plugin({
	isReady: function() {
		return jsh.js && jsh.java && jsh.io && jsh.file;
	},
	load: function() {
		var $shell = $loader.module("module.js", {
			api: {
				java: jsh.java,
				file: jsh.file
			},
			_properties: $host.getSystemProperties(),
			_environment: $host.getEnvironment()
		});
		
		var context = {};
		context.api = {
			js: jsh.js
			,java: jsh.java
			,io: jsh.io
			,file: jsh.file
		}
		context.stdio = new function() {
			this.input = jsh.io.java.adapt($host.getStdio().getStandardInput());
			this.output = jsh.io.java.adapt($host.getStdio().getStandardOutput());
			this.error = jsh.io.java.adapt($host.getStdio().getStandardError());
		}
		//	TODO	properties methods should go away; should not be necessary now
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
		$loader.run(
			"jsh.js", 
			{
				$context: context,
				$exports: $shell
			}
		);
		jsh.shell = $shell;
	}
})