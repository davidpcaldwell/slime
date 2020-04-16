//@ts-check
(
	/**
	 * @param { { scope: object } } $context
	 * @param { * } $exports
	 */
	function($context,$exports) {
		$context.scope.initialize = function() {
			var scope = this;
			scope.module = jsh.tools.git;

			scope.init = function(p) {
				var rv = scope.module.init(p);
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

			scope.remotes = jsh.shell.TMPDIR.createTemporary({ directory: true });
			//	TODO	provide $jsapi accessor for this
			var port = jsh.ip.getEphemeralPort().number;
			var daemon = scope.module.daemon({
				port: port,
				basePath: scope.remotes,
				exportAll: true
			});

			scope.daemon = {
				process: daemon,
				port: port
			};
			jsh.shell.console("new daemon = " + scope.daemon);

			//	TODO	refactor the stuff below here to improve cohesion, especially URLs, and remove repetition

			var dir = scope.remotes.getRelativePath("RemoteRepository").createDirectory();
			dir.getRelativePath("a").write("a", { append: false });
			var host = scope.init({ pathname: dir.pathname });
			host.add({ path: "a" });
			host.commit({
				all: true,
				message: "RemoteRepository a"
			});
			var remote = new scope.module.Repository({ remote: "git://127.0.0.1:" + scope.daemon.port + "/RemoteRepository" });
			scope.remote = remote;

			var child = scope.remotes.getRelativePath("child").createDirectory();
			child.getRelativePath("b").write("b", { append: false });
			var childRepository = scope.init({ pathname: child.pathname });
			childRepository.add({ path: "b" });
			childRepository.commit({
				all: true,
				message: "child b"
			});
			var childRemote = new scope.module.Repository({ remote: "git://127.0.0.1:" + scope.daemon.port + "/child" });
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
			scope.daemon.process.kill();
		}
	}
//@ts-ignore
)($context,$exports);
