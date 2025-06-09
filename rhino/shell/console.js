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
	 * @param { slime.jrunscript.shell.internal.console.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.shell.Exports["Console"]> } $export
	 */
	function($api,$context,$export) {
		$export({
			from: {
				location: function(p) {
					var q = $context.library.file.Location.file.write.old(p.location).object.text;
					var maybe = $api.fp.world.now.question(q, p.location);
					if (!maybe.present) throw new Error("Could not open file: " + p.location.pathname);
					var writer = maybe.value;

					return function(message) {
						writer.write(message);
					}
				}
			},
			line: function(separator) {
				return function(was) {
					return function(message) {
						was(message + separator);
					}
				}
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
