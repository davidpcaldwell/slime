//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2017 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.java && jsh.java.tools && jsh.java.tools.askpass && jsh.java.tools.askpass.gui && jsh.shell;
	},
	load: function() {
		if (!jsh.tools) jsh.tools = {};
		if (!jsh.tools.provision) jsh.tools.provision = {};
		var bitbucketHgClone = function(p) {
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

			var password = (p.mock && p.mock.password) ? p.mock.password : jsh.java.tools.askpass.gui({
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
					if (p.mock && p.mock.config) {
						for (var x in p.mock.config) {
							rv.push("--config", x + "=" + p.mock.config[x]);
						}
					}
					var scheme = (p.mock) ? p.mock.scheme : jsh.shell.jsh.url.scheme;
					rv.push("clone");
					rv.push(scheme + "://" + p.user + "@bitbucket.org/" + p.owner + "/" + p.repository);
					rv.push("-u", p.version);
					rv.push(p.destination);
//					Packages.java.lang.System.err.println("hg arguments:");
//					Packages.java.lang.System.err.println(rv.join(" "));
					return rv;
				})()
			});
		};

		jsh.tools.provision.clone = $api.deprecate(bitbucketHgClone);

		jsh.tools.provision.bitbucket = {};
		//	Probably should not use hg plugin given that we are potentially running this remotely
		//	TODO	use more sophisticated mechanism to decide whether to attach hg property based on Mercurial presence/absence
		jsh.tools.provision.bitbucket.hg = {
			clone: bitbucketHgClone
		};

		//	TODO	make this work for non-src shells
		jsh.tools.provision.jdk = function() {
			jsh.shell.run({
				command: jsh.shell.jsh.src.getFile("jsh/tools/provision/jdk.bash"),
				evaluate: function(result) {
					if (result.status == 1) {
						jsh.shell.console("Then re-execute the installation command.");
						jsh.shell.exit(0);
					} else {
						jsh.shell.console("JDK is up to date.");
					}
				}
			});
		}

		jsh.tools.provision.plugin = {
			test: function() {
				jsh.loader.plugins(new $loader.Child("test/"));
			}
		}
	}
})