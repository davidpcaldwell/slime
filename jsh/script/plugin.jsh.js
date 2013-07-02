plugin({
	isReady: function() {
		return jsh.js && jsh.java && jsh.file && jsh.http && jsh.shell;
	},
	load: function() {
		jsh.script = $loader.module("module.js", {
			api: {
				js: jsh.js,
				file: jsh.file,
				http: function() {
					return jsh.http;
				},
				addClasses: jsh.loader.addClasses
			},
			workingDirectory: jsh.shell.PWD,
			script: (function() {
				var uri = $host.getInvocation().getScript().getUri();
				if (uri  && uri.getScheme() && String(uri.getScheme()) == "file") {
					return jsh.file.filesystem.$jsh.Pathname(new Packages.java.io.File(uri)).file;
				}
			})(),
			uri: (function() {
				if ($host.getInvocation().getScript().getUri()) {
					return String($host.getInvocation().getScript().getUri().normalize().toString());
				}
			})(),
			uri: (function() {
				if ($host.getInvocation().getScript().getUri()) {
					return String($host.getInvocation().getScript().getUri().normalize().toString());
				}
			})(),
			packaged: (function() {
				//	TODO	push back into Invocation
				if ($host.getSystemProperties().getProperty("jsh.launcher.packaged")) {
					return jsh.file.filesystem.$jsh.Pathname(
						new Packages.java.io.File(
							$host.getSystemProperties().getProperty("jsh.launcher.packaged")
						)
					).file;
				}
				return null;
			})(),
			arguments: jsh.java.toJsArray($host.getInvocation().getArguments(), function(s) { return String(s); }),
			loader: (function() {
				if ($host.getLoader().getPackagedCode()) {
					return new jsh.io.Loader({ _source: $host.getLoader().getPackagedCode() });
				} else {
					return function(){}();
				}
			})()
		});
		jsh.shell.getopts = $api.deprecate(jsh.script.getopts);
	}
})
