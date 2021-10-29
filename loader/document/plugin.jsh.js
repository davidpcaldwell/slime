//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function($slime,jsh,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.document);
			},
			load: function() {
				//	Although we'd like the source implementation to replace the existing jsh.document, right now because of the old
				//	JSAPI implementation, we actually *depend* on an even older jsh.document in rhino/document. So we just have to
				//	augment it here.
				/** @type { slime.runtime.document.Script } */
				var script = $loader.script("module.js");
				Object.assign(jsh.document, script({
					$slime: $slime
				}));
			}
		});
	}
//@ts-ignore
)($slime,jsh,$loader,plugin);

