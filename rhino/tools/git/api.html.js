//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { { scope: object } } $context
	 * @param { slime.Loader } $loader
	 */
	function($api,jsh,$context,$loader) {
		var daemon;

		$context.scope.initialize = function() {
			/**
			 * @type { {
			 * 		init: Function
			 * 		module: slime.jrunscript.tools.git.Exports
			 * 		remotes: slime.jrunscript.file.Directory
			 * 		fixtures: {
			 * 			location: {
			 * 				temporary: () => slime.jrunscript.file.Pathname
			 * 			}
			 * 			repository: {
			 * 				local: () => void
			 * 				remote: () => void
			 * 			}
			 * 		}
			 * 		remote: slime.jrunscript.tools.git.Repository
			 * 		child: slime.jrunscript.tools.git.Repository
			 * 		fixture: {
			 * 			write: Function
			 * 		}
			 * } }
			 */
			var scope = this;
			var module = jsh.tools.git;

			scope.module = module;

			var fixtures = $loader.file("fixtures.js", { module: module });

			scope.init = fixtures.init;

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
				location: {
					temporary: function() {
						var rv = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
						rv.directory.remove();
						return rv;
					}
				},
				repository: new function() {
					var commit = function(repository,files,message) {
						//	TODO	should use execute and forEach
						$api.fp.result(
							files,
							Object.entries,
							$api.fp.Array.map(function(entry) {
								repository.directory.getRelativePath(entry[0]).write(entry[1], { append: false, recursive: true });
								repository.add({ path: entry[0] });
							})
						);
						repository.commit({ message: message });
					}

					this.remote = function(p) {
						var location = scope.remotes.getRelativePath(p.name);
						if (!location.directory) {
							location.createDirectory();
							var repository = scope.init({ pathname: location });
							if (p.files) {
								commit(repository, p.files, "initial");
							}
						}
						return {
							server: repository,
							remote: module.Repository({ remote: "git://127.0.0.1:" + daemon.port + "/" + p.name })
						};
					};

					this.local = function(p) {
						var location = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
						location.directory.remove();
						var repository = scope.init({ pathname: location });
						if (p.files) {
							commit(repository, p.files, "initial");
						}
						return repository;
					}

					this.actions = {
						commit: function(p) {
							commit(p.repository, p.files, p.message);
						}
					}
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
)($api,jsh,$context,$loader);
