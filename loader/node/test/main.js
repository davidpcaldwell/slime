//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		/** @type { slime.node.Exports } */
		var slime = require("../loader.js");
		var base = __dirname + "/";
		var loader = slime.fs.Loader({ base: base });
		console.log(JSON.stringify({
			identity: slime.runtime.$api.fp.identity(3),
			base: base,
			loader: {
				type: typeof(loader),
				files: {
					me: (function() {
						var resource = loader.get("main.js");
						var content = resource.read(String);
						return {
							type: typeof(resource),
							content: content
						}
					})(),
					foo: loader.get("foo")
				}
			}
		}, void(0), 4));
	}
)();
