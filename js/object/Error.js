//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		$exports.Error = {};

		$exports.Error.Type = function(name) {
			var rv = function Subtype(message,properties) {
				if (this instanceof Subtype) {
					this.name = name;
					this.message = (typeof(message) == "string") ? message : "";
					for (var x in properties) {
						this[x] = properties[x];
					}
				} else {
					return new Subtype(message);
				}
			};
			rv.prototype = new Error();
			return rv;
		};
	}
)();
