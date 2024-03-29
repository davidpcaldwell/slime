//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		$exports.handle = function(request) {
			if (request.path == "") {
				var code = $loader.resource("system.html").read(String);
				return {
					status: {
						code: 200
					},
					body: {
						type: "text/html",
						string: $loader.resource("system.html").read(String)
					}
				};
			}
		}
	}
)();
