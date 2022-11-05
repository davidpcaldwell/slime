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

			var updates = {};

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
						var x = $context.library.file.world.Location.directory.loader.synchronous({ root: documentation });
						return $context.library.code.directory.lastModified({
							loader: x,
							map: $api.fp.identity
						})
					}
				}
			}

			/** @type { slime.$api.events.Handler<slime.tools.documentation.updater.internal.Listener> } */
			var listener = {
				started: function(e) {
					lock.wait({
						then: function() {
							updates[e.detail.out()] = e.detail;
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
							updates[e.detail.out()] = null;
							events.fire("finished", { out: e.detail.out() });
						}
					})();
				},
				errored: function(e) {
					lock.wait({
						then: function() {
							updates[e.detail.out()] = null;
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
				run();
			} else {
				var timestamps = {
					code: world.lastModified.code(),
					documentation: world.lastModified.documentation()
				};

				if (timestamps.code.present && timestamps.documentation.present) {
					if (timestamps.code.value > timestamps.documentation.value) {
						events.fire("console", "Starting ...");
						run();
					} else {
						events.fire("unchanged");
					}
				}
			}

			return {
				run: function() {
					lock.wait({
						when: function() { return false; }
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
