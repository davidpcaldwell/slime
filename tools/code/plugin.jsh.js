//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(jsh,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.document && jsh.file && jsh.tools && jsh.tools.git);
			},
			load: function() {
				/** @type { slime.tools.code.Script } */
				var script = $loader.script("module.js");
				jsh.tools.code = script({
					library: {
						document: jsh.document,
						file: jsh.file,
						git: jsh.tools.git
					}
				})
			}
		})
	}
//@ts-ignore
)(jsh,$loader,plugin);
