//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	isReady: function() {
		return true;
	},
	load: function() {
		//	Would not work in Google App Engine because of use of sandboxed classes
		var context = $loader.file("context.java.js");
		//	TODO	load Java context
		jsh.time = $loader.module("module.js", context);
	}
})