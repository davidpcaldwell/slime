//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		$exports.message = function() {
			var rv = "";
			for (var i=0; i<3; i++) {
				rv += $context.message;
			}
			return rv;
		}();
	}
)();
