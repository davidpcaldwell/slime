//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.java && jsh.java.getClass("com.mongodb.Mongo");
	},
	load: function() {
		if (!jsh.db) jsh.db = {};
		jsh.db.mongo = $loader.module("module.js", {
			api: {
				java: jsh.java
			}
		});
	}
});
