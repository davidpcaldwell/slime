//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.tools.documentation.updater.Context } $context
	 * @param { slime.loader.Export<slime.tools.documentation.updater.Exports> } $export
	 */
	function(Packages,$api,$context,$export) {
		var isExcluded = function(root, path) {
			var relative = String(root.relativize(path));
			var parts = relative.split(/[\\/]/);
			for (var i = 0; i < parts.length; i++) {
				if (parts[i] == "node_modules" || parts[i] == "package-lock.json") return true;
				if (parts[i] == ".git") return true;
				if (parts[i] == "local" && parts[i+1] == "bin") return true;
				if (parts[i] == "local" && parts[i+1] == "chrome") return true;
				if (parts[i] == "local" && parts[i+1] == "jsh") return true;
				if (parts[i] == "local" && parts[i+1] == "doc") return true;
			}
			return false;
		};

		/** @type { slime.tools.documentation.updater.Exports["Projects"] } */
		var Projects = function(settings) {
			var root = Packages.java.nio.file.Paths.get(settings.project).toAbsolutePath().normalize();
			var noFollow = Packages.java.nio.file.LinkOption.NOFOLLOW_LINKS;
			var projects = [String(root)];

			var visit = function(directory) {
				var children = Packages.java.nio.file.Files.newDirectoryStream(directory);
				try {
					var iterator = children.iterator();
					while (iterator.hasNext()) {
						var child = iterator.next();
						if (Packages.java.nio.file.Files.isDirectory(child, noFollow) && !isExcluded(root, child)) {
							if (
								Packages.java.nio.file.Files.isRegularFile(child.resolve("README.fifty.ts"), noFollow)
								|| Packages.java.nio.file.Files.isRegularFile(child.resolve("typedoc.json"), noFollow)
							) {
								projects.push(String(child));
							}
							visit(child);
						}
					}
				} finally {
					children.close();
				}
			};

			visit(root);
			return projects;
		};

		/** @type { slime.tools.documentation.updater.Exports["test"]["Watcher"] } */
		var Watcher = function(settings) {
			var root = Packages.java.nio.file.Paths.get(settings.project).toAbsolutePath().normalize();
			var service = root.getFileSystem().newWatchService();
			/** @type { { [path: string]: slime.jrunscript.native.java.nio.file.WatchKey } } */
			var registered = {};
			var kinds = Packages.java.nio.file.StandardWatchEventKinds;
			var noFollow = Packages.java.nio.file.LinkOption.NOFOLLOW_LINKS;
			var stopped = false;

			var registerTree = function(directory) {
				if (isExcluded(root, directory) || !Packages.java.nio.file.Files.isDirectory(directory, noFollow)) return;
				var name = String(directory);
				if (!registered[name] || !registered[name].isValid()) {
					registered[name] = directory.register(service, kinds.ENTRY_CREATE, kinds.ENTRY_DELETE, kinds.ENTRY_MODIFY);
				}

				var children = Packages.java.nio.file.Files.newDirectoryStream(directory);
				try {
					var iterator = children.iterator();
					while (iterator.hasNext()) {
						registerTree(iterator.next());
					}
				} finally {
					children.close();
				}
			};

			var rescan = function() {
				registerTree(root);
			};

			var unregisterTree = function(path) {
				var prefix = String(path) + String(Packages.java.io.File.separator);
				Object.keys(registered).forEach(function(directory) {
					if (directory == String(path) || directory.indexOf(prefix) == 0) {
						registered[directory].cancel();
						delete registered[directory];
					}
				});
			};

			var process = function(key) {
				var changed = false;
				var iterator = key.pollEvents().iterator();
				while (iterator.hasNext()) {
					var event = iterator.next();
					var kind = String(event.kind().name());
					if (kind == "OVERFLOW") {
						changed = true;
						rescan();
					} else if (kind == "ENTRY_CREATE" || kind == "ENTRY_MODIFY" || kind == "ENTRY_DELETE") {
						var path = key.watchable().resolve(event.context()).normalize();
						if (!isExcluded(root, path)) {
							changed = true;
							if (kind == "ENTRY_CREATE") registerTree(path);
							if (kind == "ENTRY_DELETE") unregisterTree(path);
						}
					}
				}
				if (!key.reset()) {
					var name = String(key.watchable());
					if (registered[name] && !registered[name].isValid()) delete registered[name];
				}
				return changed;
			};

			try {
				registerTree(root);
			} catch (e) {
				service.close();
				throw e;
			}

			return {
				run: function(onChange) {
					while (!stopped) {
						var changed = false;
						try {
							changed = process(service.take());
							/** @type { slime.jrunscript.native.java.nio.file.WatchKey | null } */
							var key;
							while (!stopped && (key = service.poll(200, Packages.java.util.concurrent.TimeUnit.MILLISECONDS))) {
								changed = process(key) || changed;
							}
						} catch (e) {
							var exception = e.javaException || e;
							if (!stopped || !Packages.java.nio.file.ClosedWatchServiceException.class.isInstance(exception)) throw e;
						}
						if (changed && !stopped) onChange();
					}
				},
				stop: function() {
					if (!stopped) {
						stopped = true;
						service.close();
					}
				},
				rescan: rescan,
				isRegistered: function(path) {
					var name = String(Packages.java.nio.file.Paths.get(path).toAbsolutePath().normalize());
					return Boolean(registered[name] && registered[name].isValid());
				}
			};
		};

		/** @type { slime.tools.documentation.updater.internal.Update } */
		var Update = function(p) {
			return function(events) {
				var tmp = $api.fp.world.now.ask($context.library.file.world.Location.from.temporary($context.library.file.world.filesystems.os)({
					directory: true
				}));

				var invocation;
				try {
					invocation = $context.typedoc.invocation({
						project: { base: p.project.pathname },
						stdio: {
							output: "line",
							error: "line"
						},
						out: tmp.pathname
					});
				} catch (e) {
					events.fire("stderr", { out: tmp.pathname, line: String(e) });
					events.fire("errored", {
						out: function() { return tmp.pathname; },
						started: function() { return null; },
						kill: function() {}
					})
				}

				/** @type { number } */
				var started;
				/** @type { () => void } */
				var kill;

				/** @type { slime.tools.documentation.updater.internal.Process } */
				var object = {
					out: function() {
						return tmp.pathname;
					},
					started: function() {
						return started;
					},
					kill: function() {
						if (!kill) throw new Error("Unreachable.");
						kill();
					}
				};

				$context.library.java.logging.log({
					logger: "tools.fifty.documentation-updater",
					level: "FINE",
					message: "Running TypeDoc invocation: " + invocation
				});
				var exit = $api.fp.world.now.ask(
					invocation,
					{
						start: function(e) {
							started = new Date().getTime();
							kill = e.detail.kill;
							events.fire("started", object);
						},
						stdout: function(e) {
							events.fire("stdout", { out: tmp.pathname, line: e.detail.line });
						},
						stderr: function(e) {
							events.fire("stderr", { out: tmp.pathname, line: e.detail.line });
						}
					}
				);
				if (exit.status == 0) {
					events.fire("finished", object);
				} else {
					events.fire("stderr", { out: tmp.pathname, line: "TypeDoc exit code: " + exit.status });
					events.fire("errored", object);
				}
			}
		}

		/** @type { slime.tools.documentation.updater.Exports["Updater"] } */
		var Updater = function(settings) {
			var events = $api.events.Handlers.attached(settings.events);

			var state = {
				/** @type { { [out: string]: slime.tools.documentation.updater.internal.Process } } */
				updates: {},
				/** @type { number } */
				typedocBasedOnSrcAt: void(0),
				stopped: false
			}

			var lock = $context.library.java.Thread.Lock();
			var watcher = settings.watch ? Watcher({ project: settings.project }) : null;

			var project = $context.library.file.world.Location.from.os(settings.project);

			var documentation = $api.fp.now.invoke(
				project,
				$context.library.file.world.Location.relative("local/doc/typedoc")
			);

			var directoryExists = $api.fp.world.mapping(
				$context.library.file.world.Location.directory.exists.wo
			);

			var removeDirectory = $context.library.file.Location.remove({
				recursive: true
			}).simple;

			/**
			 *
			 * @param { slime.jrunscript.file.Location } from
			 */
			var moveTypedocIntoPlace = function(from) {
				var effect = $api.fp.now(
					$context.library.file.Filesystem.move,
					$api.fp.world.Means.effector()
				);
				effect({
					filesystem: $context.library.file.world.filesystems.os,
					from: from.pathname,
					to: documentation.pathname
				});
			};

			var world = {
				lastModified: {
					code: function() {
						return $context.library.code.git.lastModified({
							base: settings.project
						})
					},
					documentation: function() {
						var exists = $api.fp.world.Sensor.old.mapping({ sensor: $context.library.file.Location.directory.exists.wo });
						if (!exists(documentation)) return $api.fp.Maybe.from.nothing();
						var loader = $context.library.file.Location.directory.loader.synchronous({ root: documentation });
						return $context.library.code.directory.lastModified({
							loader: loader,
							map: $api.fp.identity
						})
					}
				},
				//	Estimate of how long it takes TypeDoc to run
				//	TODO	make this empirical after initial estimate
				//	TODO	base initial estimate on project size
				duration: function() {
					return 300000;
				}
			};

			var getLatestUpdateStart = function() {
				/** @type { number } */
				var latest = void(0);
				return $api.fp.now.invoke(
					state.updates,
					function(p) { return Object.entries(p) },
					$api.fp.Array.map(function(entry) {
						return entry[1];
					}),
					function(x) {
						return x.reduce(function(rv,item) {
							if (typeof(rv) == "undefined") return item.started();
							var started = item.started();
							return (started > rv) ? started : rv;
						},latest);
					}
				)
			};

			/**
			 *
			 * @param { slime.tools.documentation.updater.internal.Process } process
			 */
			var getElapsedTime = function(process) {
				return new Date().getTime() - process.started();
			}

			var getTimestamps = function() {
				var code = world.lastModified.code();
				return {
					code: code,
					documentation: (
						function() {
							var latest = getLatestUpdateStart();
							if (typeof(latest) != "undefined") return $api.fp.Maybe.from.some(latest);
							if (state.typedocBasedOnSrcAt) return $api.fp.Maybe.from.some(state.typedocBasedOnSrcAt);
							return world.lastModified.documentation();
						}
					)()
				};
			}

			/** @type { slime.$api.event.Handlers<slime.tools.documentation.updater.internal.Listener> } */
			var listener = {
				started: function(e) {
					lock.wait({
						then: function() {
							Object.entries(state.updates).forEach(function(array) {
								var process = array[1];
								var elapsed = getElapsedTime(process);
								if (elapsed < (world.duration() / 2)) {
									var out = process.out();
									events.fire("stopping", { out: out });
									process.kill();
									var location = $context.library.file.world.Location.from.os(out);
									$api.fp.world.now.action(
										$context.library.file.world.Location.directory.remove.wo,
										location
									);
								}
							})
							state.updates[e.detail.out()] = e.detail;
							events.fire("updating", { out: e.detail.out() });
						}
					})();
				},
				stdout: function(e) {
					events.fire("stdout", e.detail);
				},
				stderr: function(e) {
					events.fire("stderr", e.detail);
				},
				finished: function(e) {
					lock.wait({
						then: function() {
							if (directoryExists(documentation)) {
								removeDirectory(documentation);
							}
							try {
								moveTypedocIntoPlace($context.library.file.Location.from.os(e.detail.out()));
								delete state.updates[e.detail.out()];
								state.typedocBasedOnSrcAt = e.detail.started();
								events.fire("finished", { out: e.detail.out() });
							} catch (e) {
								//	TODO	add some kind of error handling
								// Packages.java.lang.System.err.println("Failed to update documentation.");
								// Packages.java.lang.System.err.println(e);
							}
						}
					})();
				},
				errored: function(e) {
					lock.wait({
						then: function() {
							delete state.updates[e.detail.out()];
							events.fire("errored", { out: e.detail.out() });
						}
					})();
				}
			};

			var runUpdate = function() {
				lock.wait({
					then: function() {
						if (state.stopped) return;
						$context.library.java.Thread.start({
							call: function() {
								$api.fp.world.now.action(
									Update,
									{
										project: project
									},
									listener
								)
							}
						});
					}
				})();
			};

			events.fire("initialized", { project: settings.project });

			return {
				run: function() {
					try {
						if (!state.stopped) {
							if (!directoryExists(documentation)) {
								events.fire("creating");
								runUpdate();
							} else {
								var timestamps = getTimestamps();
								if (timestamps.code.present && timestamps.documentation.present) {
									if (timestamps.code.value > timestamps.documentation.value) {
										runUpdate();
									} else {
										events.fire("unchanged", {
											code: timestamps.code.value,
											documentation: timestamps.documentation.value
										});
									}
								}
							}
							if (watcher) watcher.run(runUpdate);
						}
					} finally {
						if (watcher) watcher.stop();
						events.fire("destroyed");
					}
				},
				update: function() {
					runUpdate();
				},
				stop: function() {
					events.fire("destroying");
					lock.wait({
						then: function() {
							$api.events.Handlers.detach(events);
							state.stopped = true;
							if (watcher) watcher.stop();
						}
					})();
				}
			};
		};

		$export({
			Updater: Updater,
			Projects: Projects,
			test: {
				Update: Update,
				Watcher: Watcher
			}
		});
	}
//@ts-ignore
)(Packages,$api,$context,$export);
