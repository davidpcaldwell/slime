//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { (value: slime.jsh.unit.mock.handler) => void } $export
	 */
	function($export) {
		$export(
			function(request) {
				if (request.headers.value("host") == "mockweb.slime.com") {
					return {
						status: {
							code: 200
						},
						body: {
							type: "application/json",
							string: JSON.stringify({ method: request.method, path: request.path })
						}
					}
				}
				return void(0);
			}
		)
	}
//@ts-ignore
)($export)