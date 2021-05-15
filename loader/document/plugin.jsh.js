//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.document;
	},
	load: function() {
		var module = $loader.module("module.js", {
			$slime: $slime
		});
		jsh.document.load = function(p) {
			return module.load(p);
		};
	}
})