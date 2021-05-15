//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	load: function() {
		Object.defineProperty(
			jsh,
			"java",
			{
				get: $api.Function.memoized(function() {
					return $loader.module("module.js", {
						globals: true,
						$slime: $slime
					});
				}),
				enumerable: true
			}
		);
	}
})