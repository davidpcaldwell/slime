//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var a = 3;

		var c = 5;

		$exports.a = a;
		$exports.b = $context.b;
		$exports.c = c;

		$exports.thisName = this.description;
	}
).call(this);
