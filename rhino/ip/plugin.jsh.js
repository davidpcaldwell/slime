//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.shell;
	},
	load: function() {
		jsh.ip = $loader.module("module.js", {
			api: {
				shell: jsh.shell
			}
		});
	}
});
