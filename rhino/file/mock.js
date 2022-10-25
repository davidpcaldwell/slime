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
	 * @param { slime.jrunscript.file.internal.mock.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.mock.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @returns { slime.jrunscript.file.world.spi.Filesystem }
		 */
		var Mock = function() {
			return {
				copy: void(0),
				createDirectory: void(0),
				directoryExists: void(0),
				fileExists: void(0),
				move: void(0),
				openInputStream: void(0),
				openOutputStream: void(0),
				temporary: void(0),
				relative: void(0),
				Directory: void(0),
				File: void(0),
				Pathname: void(0),
				pathname: void(0)
			}
		};

		$export({
			filesystem: function() {
				return Mock();
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
