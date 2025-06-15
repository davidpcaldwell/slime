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
	 * @param { slime.jrunscript.file.internal.wo.filesystem.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.wo.filesystem.Exports> } $export
	 */
	function($api,$context,$export) {
		/** @type { slime.jrunscript.file.location.Filesystem } */
		var Filesystem = (
			function() {
				return {
					copy: function(p) {
						return function(events) {
							$api.fp.world.now.action(
								$context.ensureParent,
								{
									filesystem: p.filesystem,
									pathname: p.to
								},
								{
									created: function(e) {
										events.fire("created", e.detail.pathname);
									}
								}
							)

							p.filesystem.copy({
								from: p.from,
								to: p.to
							})(events);
						}
					},
					move: function(p) {
						return function(events) {
							//	TODO	these checks were done for directories, but when refactoring, were removed. Possibly they
							//			should be generalized.

							// var exists = $api.fp.world.now.question(
							// 	location.filesystem.directoryExists,
							// 	{ pathname: location.pathname }
							// );
							// if (!exists.present) throw new Error("Could not determine whether " + location.pathname + " exists in " + location.filesystem);
							// if (!exists.value) throw new Error("Could not move directory: " + location.pathname + " does not exist (or is not a directory).");

							$api.fp.world.now.action(
								$context.ensureParent,
								{
									filesystem: p.filesystem,
									pathname: p.to
								},
								{
									created: function(e) {
										events.fire("created", e.detail.pathname);
									}
								}
							)

							p.filesystem.move({
								from: p.from,
								to: p.to
							})(events);
						}
					}
				}
			}
		)();

		$export(Filesystem);
	}
//@ts-ignore
)($api,$context,$export);
