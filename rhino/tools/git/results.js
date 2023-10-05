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
	 * @param { slime.jrunscript.tools.git.internal.results.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.git.internal.results.Exports> } $export
	 */
	function($api,$context,$export) {


		$export({
			config: {
				list: $api.fp.pipe(
					$api.fp.string.split("\n"),
					$api.fp.Array.filter(Boolean),
					$api.fp.Array.map(
						$api.fp.pipe(
							$api.fp.string.split("="),
							//	TODO	would be nice if there were a typesafe way to simplify this, but it is not straightforward
							function(tokens) { return { name: tokens[0], value: tokens[1] }; }
						)
					)
				)
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
