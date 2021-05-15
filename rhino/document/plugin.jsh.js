//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js && jsh.js.document && jsh.java;
	},
	load: function() {
		//	TODO	seems to be undocumented that $slime returns null for absent files
		if ($slime.getLibraryFile("jsoup.jar") && $slime.getLibraryFile("jsoup.jar").exists()) {
			$slime.classpath.add({
				jar: {
					_file: $slime.getLibraryFile("jsoup.jar")
				}
			})
		}
		jsh.document = $loader.module("module.js", {
			pure: jsh.js.document,
			api: {
				java: jsh.java
			}
		});
	}
});
