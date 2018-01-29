plugin({
	isReady: function() {
		var pluginIsReady = function(path) {
			var implementation;
			$loader.run(path + "plugin.jsh.js", {
				plugin: function(o) {
					implementation = o;
				},
				jsh: jsh
			});
			return implementation.isReady();
		}
		return jsh.shell && pluginIsReady("install/") && pluginIsReady("provision/");
	},
	load: function() {
		if (!jsh.tools) jsh.tools = {};
		
		jsh.loader.plugins(new $loader.Child("install/"));
		jsh.loader.plugins(new $loader.Child("provision/"));
		
		jsh.tools.rhino = new function() {
			//	TODO	migrate toward this structure
		};
		
		jsh.tools.tomcat = new function() {
			//	TODO	migrate toward this structure			
		};
		
		jsh.tools.ncdbg = new function() {
			Object.defineProperty(this, "installed", {
				get: function() {
					return jsh.shell.jsh.lib.getSubdirectory("ncdbg");
				}
			});
			
			this.install = function(p) {
				jsh.shell.console("Installing ncdbg ...");
				jsh.tools.install.install({
					url: "https://github.com/provegard/ncdbg/releases/download/0.6.0/ncdbg-0.6.0.zip",
					format: jsh.tools.install.format.zip,
					to: jsh.shell.jsh.lib.getRelativePath("ncdbg")
				});
				jsh.shell.run({
					command: "chmod",
					arguments: [
						"+x",
						jsh.shell.jsh.lib.getSubdirectory("ncdbg").getFile("bin/ncdbg")
					]
				});
			}
		}
	}
})