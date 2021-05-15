//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.java && jsh.java.tools && jsh.java.getClass("org.openqa.selenium.By");
	},
	load: function() {
		jsh.java.tools.selenium = $loader.module("module.js");
	}
});
