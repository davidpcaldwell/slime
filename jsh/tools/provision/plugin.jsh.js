plugin({
	isReady: function() {
		return jsh.java && jsh.java.tools && jsh.java.tools.askpass && jsh.java.tools.askpass.gui && jsh.shell;
	},
	load: function() {
		if (!jsh.tools) jsh.tools = {};
		if (!jsh.tools.provision) jsh.tools.provision = {};
		jsh.tools.provision.clone = function(p) {
			if (!p.owner) p.owner = p.user;
			if (!p.version) p.version = "tip";
			p.destination.parent.createDirectory({
				ifExists: function(dir) {
					return false;
				}
			});
			if (p.destination.directory) {
				throw new Error("Destination already exists: " + p.destination);
			}

			var password = jsh.java.tools.askpass.gui({
				prompt: "Enter password for Bitbucket (" + p.user + ")"
			});

			var proxy = (function() {
				if (Packages.java.lang.System.getProperty("http.proxyHost")) {
					var rv = String(Packages.java.lang.System.getProperty("http.proxyHost"));
					if (Packages.java.lang.System.getProperty("http.proxyPort")) {
						rv += ":" + String(Packages.java.lang.System.getProperty("http.proxyPort"));
					}
					return rv;
				}
			})();

			var config = {
				"auth.bitbucket.prefix": "bitbucket.org",
				"auth.bitbucket.username": p.user,
				"auth.bitbucket.password": password
			};

			jsh.shell.run({
				command: "hg",
				arguments: (function() {
					var rv = [];
					if (p.debug) rv.push("-v");
					if (proxy) rv.push("--config", "http_proxy.host=" + proxy);
					for (var x in config) {
						rv.push("--config", x + "=" + config[x]);
					}
					rv.push("clone");
					rv.push(jsh.shell.jsh.url.scheme + "://" + p.user + "@bitbucket.org/" + p.owner + "/" + p.repository);
					rv.push("-u", p.version);
					rv.push(p.destination);
					jsh.shell.console("Cloning to " + p.destination + " ...");
					return rv;
				})()
			});
			jsh.shell.console("Cloned to " + p.destination);
		}

		jsh.tools.provision.plugin = {
			test: function() {
				jsh.loader.plugins(new $loader.Child("test/"));				
			}
		}
	}
})