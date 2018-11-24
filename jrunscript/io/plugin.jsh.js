//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jrunscript/io SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js && jsh.java;
	},
	load: function() {
		jsh.io = $loader.module("module.js", {
			$slime: {
				io: $slime.io,
				mime: $slime.mime,
				Loader: $slime.Loader,
				Resource: $slime.Resource
			},
			api: {
				js: jsh.js,
				java: jsh.java
			}
		})
	}
});

plugin({
	isReady: function() {
		return jsh.shell;		
	},
	load: function() {
		//	Load POI if it is present
		var POI = jsh.shell.jsh.lib && jsh.shell.jsh.lib.getSubdirectory("poi");
		if (POI) {
			var addLibDirectory = function(dir) {
				dir.list().forEach(function(node) {
					if (/\.jar$/.test(node.pathname.basename)) {
						jsh.loader.plugins(node.pathname);
					}
				})
			};

			addLibDirectory(POI.getSubdirectory("lib"));
			addLibDirectory(POI.getSubdirectory("ooxml-lib"));
			addLibDirectory(POI);
		}		
	}
});
