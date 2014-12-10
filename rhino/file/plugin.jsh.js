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
		return jsh.loader && jsh.js && jsh.java && jsh.io;
	},
	load: function() {
		var context = {
			$rhino: $jsh
		};
		context.api = {
			js: jsh.js,
			java: jsh.java,
			io: jsh.io
		};
		context.$pwd = String( $jsh.getSystemProperties().getProperty("user.dir") );
		context.addFinalizer = jsh.loader.addFinalizer;

		var convert = function(value) {
			if ( String(value) == "undefined" ) return function(){}();
			if ( String(value) == "null" ) return null;
			return String(value);
		}

		if (convert($jsh.getSystemProperties().getProperty("cygwin.root")) || convert($jsh.getSystemProperties().getProperty("cygwin.paths"))) {
			context.cygwin = {
				root: convert( properties.cygwin.root ),
				paths: convert( properties.cygwin.paths )
			}
		}
		var environment = jsh.java.Environment($jsh.getEnvironment());
		if (environment.PATHEXT) {
			context.pathext = environment.PATHEXT.split(";");
		}
		jsh.file = $loader.module("module.js", context);
	}
})