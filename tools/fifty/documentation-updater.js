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
						output: "string",
						error: "string"
					},
					out: tmp.pathname
				});

				/** @type { number } */
				var started;
				/** @type { () => void } */
				var kill;

				$context.library.java.Thread.start(function() {
					$api.fp.world.now.action(
						$context.library.shell.world.action,
						invocation,
						{
							start: function(e) {
								started = new Date().getTime();
								kill = e.detail.kill;
								events.fire("started", tmp);
							},
							exit: function(e) {
								if (e.detail.status == 0) {
									events.fire("finished", tmp);
								}
							}
						}
					);
				});

				return {
					started: function() {
						return started;
					},
					kill: function() {
						kill();
					}
				}
			}
		}

		var existsDirectory = $api.fp.world.mapping(
			$context.library.file.world.Location.directory.exists()
		);

		/** @type { slime.tools.documentation.updater.Exports["Updater"] } */
		var Updater = function(settings) {
			var updates = {};

			var lock = new $context.library.java.Thread.Monitor();

			var project = $context.library.file.world.Location.from.os(settings.project);

			var documentation = $api.fp.now.invoke(
				project,
				$context.library.file.world.Location.relative("local/doc/typedoc")
			);

			/** @type { slime.$api.events.Handler<slime.tools.documentation.updater.internal.Listener> } */
			var listener = {
				started: function(e) {
					lock.Waiter({

					})();
				},
				finished: function(e) {

				}
			}

			if (!existsDirectory(documentation)) {
				$api.fp.world.now.action(
					Update,
					{ project: project },
					listener
				);
			}

			return {};
		}
	}
//@ts-ignore
)($api,$context,$export);
