plugin({
	isReady: function() {
		return jsh.test;
	},
	load: function() {
		jsh.test.provision = {};
		
		var getMockConfiguration = function(base,isPrivateRepository) {
			var repository = new hg.Repository({ local: base });
			var all = [];

			var addRepositories = function recurse(top) {
				all.push(top);
				var sub = top.subrepositories();
				if (sub) {
					sub.forEach(function(r) {
						recurse(r);
					})
				}
			};

			addRepositories(repository);

			var bitbucket = {
				src: {
				}
			};
			var isPrivate = function(owner,repository) {
				if (owner == "davidpcaldwell" && (repository == "slim" || repository == "slime")) return false;
				if (owner == "davidpcaldwell") return true;
				return isPrivateRepository(owner,repository);
			}
			all.forEach(function(r) {
				var origin = r.paths.default;
				var tokens = origin.url.path.substring(1).split("/");
				var owner = tokens[0];
				var repository = tokens[1];
				if (!bitbucket.src[owner]) {
					bitbucket.src[owner] = {};
				}
				if (!bitbucket.src[owner][repository]) {
					bitbucket.src[owner][repository] = { 
						directory: r.directory,
						access: (isPrivate(owner,repository)) ? { user: owner, password: "foo" } : void(0)
					}
				}
			});
			return bitbucket;
		};

		jsh.test.provision.Server = function(o) {
			var server = new jsh.test.mock.Internet();
			var bitbucket = (function() {
				if (o.bitbucket) return o.bitbucket;
				//	TODO	publish this API and make it work for non-davidpcaldwell repositories
				if (o.base) return getMockConfiguration(o.base);
			})();
			if (!o.bitbucket.src.davidpcaldwell) o.bitbucket.src.davidpcaldwell = {};
			if (!o.bitbucket.src.davidpcaldwell.slime) {
				o.bitbucket.src.davidpcaldwell.slime = {
					directory: jsh.shell.jsh.src,
					downloads: {
						"jdk-8u112-macosx-x64.dmg": jsh.shell.user.downloads.getFile("jdk-8u112-macosx-x64.dmg"),
						"jdk-8u112-linux-x64.tar.gz": jsh.shell.user.downloads.getFile("jdk-8u112-linux-x64.tar.gz")
					}
				};
			}
			server.add(jsh.test.mock.Internet.bitbucket(bitbucket));
			return server;
		};
		jsh.test.provision.Server.getMockBitbucketConfiguration = getMockConfiguration;
		
		var writeUrl = function(url,mock) {
			if (mock) url = url.replace(/https:\/\//g, "http://");
			if (mock) url = url.replace(/raw\/tip/g, "raw/local");
			return url;
		}

		var proxy = function(mock) {
			return "export http_proxy=http://" + mock.server.host + ":" + mock.server.port;
		}

		var variables = function(mock) {
			if (mock) return ["INONIT_PROVISION_VERSION=local","INONIT_PROVISION_PROTOCOL=http"]
			return [];
		};

		var curl = function(closed,mock) {
			return "curl -s -L " + ((closed) ? "-o $TMP_INSTALLER " : "") + writeUrl("https://bitbucket.org/api/1.0/repositories/davidpcaldwell/slime/raw/tip/jsh/tools/provision/remote.bash",mock);
		};

		jsh.test.provision.Command = function(p) {
			this.commands = [];
			if (p.mock) this.commands.push(proxy(p.mock));

			this.toString = function() {
				if (this.commands.length > 1) {
					return "(" + this.commands.join(";\n") + ")";
				} else {
					return this.commands[0];
				}
			}

			if (!p.user) {
				var mockVariables = variables(p.mock).join(" ");
				if (mockVariables) mockVariables += " ";
				this.commands.push(curl(false,p.mock) + " | env " + mockVariables + "INONIT_PROVISION_SCRIPT_JSH=" + writeUrl(p.script,p.mock) + " bash");		
			} else {
				this.commands.push("export TMP_INSTALLER=$(mktemp)");
				this.commands.push("export INONIT_PROVISION_SCRIPT_JSH=" + writeUrl(p.script,p.mock));
				this.commands.push("export INONIT_PROVISION_USER=" + p.user);
				this.commands.push.apply(this.commands,variables(p.mock).map(function(declaration) {
					return "export " + declaration;
				}));
				this.commands.push(curl(true,p.mock));
				this.commands.push("chmod +x $TMP_INSTALLER");
				this.commands.push("$TMP_INSTALLER");		
			}
		}

	}
})