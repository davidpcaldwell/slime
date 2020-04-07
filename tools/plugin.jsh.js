//@ts-check
(
	/**
	 * @param {jsh.plugin.plugin} plugin
	 */
	function(plugin) {
		plugin({
			isReady: function() {
				return jsh.shell && jsh.ui;
			},
			load: function() {
				//@ts-ignore
				jsh.sdlc = {};
				var guiAsk = function(pp) {
					return function(p) {
						//	TODO	this "works" but could be improved in terms of font size and screen placement
						return jsh.ui.askpass.gui({
							prompt: "Enter " + pp.name + " for Git repository " + p.repository.directory.toString(),
							nomask: true
						});
					}
				};

				/**
				 * @param {Function} a
				 * @param {object} b
				 * @returns { Function & object }
				 */
				var assign = function(a,b) {
					var rv = a;
					for (var x in b) {
						rv[x] = b[x];
					}
					return rv;
				};

				jsh.sdlc.requireGitIdentity = assign(function(p) {
					var get = p.get || {
						name: function(p) {
							throw new Error("Missing: user.name");
						},
						email: function(p) {
							throw new Error("Missing: user.email");
						}
					};
					var config = p.repository.config({
						arguments: ["--list"]
					});
					if (!config["user.name"]) {
						jsh.shell.console("Getting user.name for " + p.repository);
						p.repository.config({
							arguments: ["user.name", get.name({ repository: p.repository })]
						});
					} else {
						jsh.shell.console("Found user.name " + config["user.name"] + " for " + p.repository);
					}
					if (!config["user.email"]) {
						jsh.shell.console("Getting user.name for " + p.repository);
						p.repository.config({
							arguments: ["user.email", get.email({ repository: p.repository })]
						});
					} else {
						jsh.shell.console("Found user.email " + config["user.email"] + " for " + p.repository);
					}
				}, {
					get: {
						gui: {
							name: guiAsk({ name: "user.name" }),
							email: guiAsk({ name: "user.email" })
						}
					}
				});
			}
		})
	}
//@ts-ignore
)(plugin)