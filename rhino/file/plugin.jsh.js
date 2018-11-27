//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the rhino/file SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.loader && jsh.loader.addFinalizer && jsh.js && jsh.java && jsh.io;
	},
	load: function() {
		var context = {
			$slime: {
				Resource: $slime.Resource
			},
			$pwd: $slime.getSystemProperty("user.dir"),
			addFinalizer: jsh.loader.addFinalizer,
			api: {
				js: jsh.js,
				java: jsh.java,
				io: jsh.io
			}
		};

		//	Windows
		var environment = jsh.java.Environment($slime.getEnvironment());
		if (environment.PATHEXT) {
			context.pathext = environment.PATHEXT.split(";");
		}

		//	Cygwin
		$loader.run("plugin.jsh.cygwin.js", { $slime: $slime, context: context });

		jsh.file = $loader.module("module.js", context);
	}
})