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
		var poi = $slime.getLibraryFile("poi");
		if (poi) {
			var addLibDirectory = function(dir) {
				jsh.java.Array.adapt(dir.listFiles()).forEach(function(_file) {
					if (_file.getName().endsWith(".jar")) {
						$slime.classpath.add({ jar: { _file: _file }});
					}
				});
			};

			addLibDirectory(new Packages.java.io.File(poi, "lib"));
			addLibDirectory(new Packages.java.io.File(poi, "ooxml-lib"));
			addLibDirectory(poi);			
		}

		jsh.io = $loader.module("module.js", {
			$slime: {
				io: $slime.io,
				mime: $slime.mime,
				Loader: $slime.Loader,
				Resource: $slime.Resource,
				getLibraryFile: $slime.getLibraryFile
			},
			api: {
				js: jsh.js,
				java: jsh.java
			}
		})
	}
});
