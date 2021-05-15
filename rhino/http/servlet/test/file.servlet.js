//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		$exports.handle = function(request) {
			debugger;
			var resource = httpd.loader.get(request.path);
			if (resource) {
				return {
					status: {
						code: 200
					},
					headers: [],
					body: {
						type: null,
						stream: resource.read(httpd.io.Streams.binary)
					}
				}
			} else {
				return {
					status: {
						code: 404
					},
					headers: []
				}
			}
		};
	}
)();
