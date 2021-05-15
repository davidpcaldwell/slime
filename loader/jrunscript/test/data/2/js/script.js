//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		$exports.multiply = function(a,b) {
			var multiplier = new Packages.module.Module();
			$context.echo("Multiplying " + a + " by " + b);
			return multiplier.multiply(a,b);
		}
	}
)();
