//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.tools.documentation.updater.Context } $context
	 * @param { slime.loader.Export<slime.tools.documentation.updater.Exports> } $export
	 */
	function($api,$context,$export) {
		/** @type { slime.tools.documentation.updater.internal.Update } */
		var Update = function(p) {
			return function(events) {
				var tmp = $api.fp.world.now.ask($context.library.file.world.filesystems.os.temporary({
					directory: true
				}));

				var invocation = $context.typedoc.invocation({
					project: { base: p.project.pathname },
					stdio: {
						output: "line",
						error: "line"
					},
					out: tmp.pathname
				});

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

				$api.fp.world.now.action(
					$context.library.shell.world.action,
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
						},
						exit: function(e) {
							if (e.detail.status == 0) {
								events.fire("finished", object);
							} else {
								events.fire("errored", object);
							}
						}
					}
				);
			}
		}

		var existsDirectory = $api.fp.world.mapping(
			$context.library.file.world.Location.directory.exists()
		);

		/** @type { slime.tools.documentation.updater.Exports["Updater"] } */
		var Updater = function(settings) {
			var eventsListener = $api.events.toListener(settings.events);
			eventsListener.attach();
			var events = eventsListener.emitter;

			var state = {
				/** @type { { [out: string]: slime.tools.documentation.updater.internal.Process } } */
				updates: {},
				/** @type { number } */
				typedocBasedOnSrcAt: void(0),
				lastCodeUpdatedTimestamp: void(0),
				codeCheckInterval: 10000,
				stopped: false
			}

			var lock = $context.library.java.Thread.Lock();

			var project = $context.library.file.world.Location.from.os(settings.project);

			var documentation = $api.fp.now.invoke(
				project,
				$context.library.file.world.Location.relative("local/doc/typedoc")
			);

			var directoryExists = $api.fp.world.mapping(
				$context.library.file.world.Location.directory.exists()
			);

			var removeDirectory = $api.fp.world.output(
				$context.library.file.world.Location.directory.remove()
			);

			var moveTypedocIntoPlace = $api.fp.world.output(
				$context.library.file.world.Location.directory.move({
					to: documentation
				})
			);

			var world = {
				lastModified: {
					code: function() {
						return $context.library.code.git.lastModified({
							base: settings.project
						})
					},
					documentation: function() {
						var loader = $context.library.file.world.Location.directory.loader.synchronous({ root: documentation });
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

			var setInterval = function(interval) {
				state.codeCheckInterval = interval;
				events.fire("setInterval", state.codeCheckInterval);
			}

			var getTimestamps = function() {
				var code = world.lastModified.code();
				if (code.present) {
					if (code.value == state.lastCodeUpdatedTimestamp) {
						//	TODO	nice little false delta
						setInterval(state.codeCheckInterval * 2);
					} else {
						setInterval(10000);
						state.lastCodeUpdatedTimestamp = code.value;
					}
				}
				return {
					code: code,
					documentation: (
						function() {
							var latest = getLatestUpdateStart();
							if (typeof(latest) != "undefined") return $api.fp.Maybe.value(latest);
							if (state.typedocBasedOnSrcAt) return $api.fp.Maybe.value(state.typedocBasedOnSrcAt);
							return world.lastModified.documentation();
						}
					)()
				};
			}

			/** @type { slime.$api.events.Handler<slime.tools.documentation.updater.internal.Listener> } */
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
										$context.library.file.world.Location.directory.remove(),
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
							moveTypedocIntoPlace($context.library.file.world.Location.from.os(e.detail.out()));
							delete state.updates[e.detail.out()];
							state.typedocBasedOnSrcAt = e.detail.started();
							events.fire("finished", { out: e.detail.out() });
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

			var run = function() {
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
			};

			events.fire("initialized", { project: settings.project });

			if (!existsDirectory(documentation)) {
				events.fire("creating");
				run();
			}

			return {
				run: function() {
					while(!state.stopped) {
						lock.wait({
							when: function() { return true; },
							then: function() {
								var timestamps = getTimestamps();

								if (timestamps.code.present && timestamps.documentation.present) {
									if (timestamps.code.value > timestamps.documentation.value) {
										run();
									} else {
										events.fire("unchanged", {
											code: timestamps.code.value,
											documentation: timestamps.documentation.value
										});
									}
								}
							}
						})();

						lock.wait({
							when: (
								function() {
									var called = false;
									return function() {
										if (!called) {
											called = true;
											return false;
										}
										return true;
									};
								}
							)(),
							timeout: function() { return state.codeCheckInterval; }
						})();
					}
				},
				update: function() {
					lock.wait({
						then: function() {
							setInterval(10000);
						}
					})();
				}//,
				// stop: function() {
				// 	//	TODO	detach listener, stop threads
				// }
			};
		};

		$export({
			Updater: Updater
		});
	}
//@ts-ignore
)($api,$context,$export);
