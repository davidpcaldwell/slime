//@ts-check
(
	/**
	 * @param { { scope: object } } $context
	 * @param { * } $exports
	 */
	function($context,$exports) {
		var daemon;

		$context.scope.initialize = function() {
			/**
			 * @type { {
			 * 		init: Function
			 * 		module: slime.jrunscript.git.Exports
			 * 		remotes: slime.jrunscript.file.Directory
			 * 		fixtures: {
			 * 			repositories: {
			 * 				create: () => void
			 * 			}
			 * 		}
			 * 		remote: slime.jrunscript.git.Repository
			 * 		child: slime.jrunscript.git.Repository
			 * 		fixture: {
			 * 			write: Function
			 * 		}
			 * } }
			 */
			var scope = this;
			var module = jsh.tools.git;

			scope.module = module;

			scope.init = function(p) {
				var rv = module.init(p);
				rv.execute({
					command: "config",
					arguments: [
						"user.email", "slime@davidpcaldwell.com"
					]
				});
				rv.execute({
					command: "config",
					arguments: [
						"user.name", "David P. Caldwell"
					]
				});
				return rv;
			};

			var castToDirectory = function(node) {
				/**
				 * @type { (p: slime.jrunscript.file.Node) => p is slime.jrunscript.file.Directory }
				 */
				var isDirectory = function(p) {
					return true;
				};

				if (isDirectory(node)) {
					return node;
				} else {
					throw new TypeError();
				}
			};

			scope.remotes = castToDirectory(jsh.shell.TMPDIR.createTemporary({ directory: true }));

			daemon = module.daemon({
				port: jsh.ip.getEphemeralPort().number,
				basePath: scope.remotes.pathname,
				exportAll: true
			});

			scope.fixtures = {
				repositories: new function() {
					this.create = function(p) {
						var location = scope.remotes.getRelativePath(p.name);
						if (!location.directory) {
							location.createDirectory();
							var repository = scope.init({ pathname: scope.remotes.getRelativePath(p.name) });
							if (p.files) {
								//	TODO	should use execute and forEach
								$api.Function.result(
									p.files,
									$api.Function.Object.entries,
									$api.Function.Array.map(function(entry) {
										location.directory.getRelativePath(entry[0]).write(entry[1], { append: false, recursive: true });
										repository.add({ path: entry[0] });
									})
								);
								repository.commit({ message: "initial" });
							}
						}
						return {
							server: repository,
							remote: module.Repository({ remote: "git://127.0.0.1:" + daemon.port + "/" + p.name })
						};
					};
				}
			};

			//	TODO	refactor the stuff below here to improve cohesion, especially URLs, and remove repetition

			var dir = scope.remotes.getRelativePath("RemoteRepository").createDirectory();
			dir.getRelativePath("a").write("a", { append: false });
			var host = scope.init({ pathname: dir.pathname });
			host.add({ path: "a" });
			host.commit({
				all: true,
				message: "RemoteRepository a"
			});
			var remote = module.Repository({ remote: "git://127.0.0.1:" + daemon.port + "/RemoteRepository" });
			scope.remote = remote;

			var child = scope.remotes.getRelativePath("child").createDirectory();
			child.getRelativePath("b").write("b", { append: false });
			var childRepository = scope.init({ pathname: child.pathname });
			childRepository.add({ path: "b" });
			childRepository.commit({
				all: true,
				message: "child b"
			});
			var childRemote = module.Repository({ remote: "git://127.0.0.1:" + daemon.port + "/child" });
			scope.child = childRemote;

			scope.fixture = {
				write: function(o) {
					var directory = (function() {
						if (o.repository) return o.repository.directory;
						if (o.directory) return o.directory;
					})();
					for (var x in o.files) {
						//	TODO	add function form which receives string as argument
						directory.getRelativePath(x).write(o.files[x], { append: false });
					}
				}
			};
		}

		$context.scope.destroy = function() {
			jsh.shell.console("destroying daemon");
			daemon.kill();
		}
	}
//@ts-ignore
)($context,$exports);
