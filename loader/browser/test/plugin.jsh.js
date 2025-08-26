//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(jsh,$slime,plugin) {
		plugin({
			isReady: function() {
				return true;
			},
			load: function() {
				jsh.typescript = {
					compile: function(code) {
						var maybe = $slime.compiler.compile({
							name: "<jsh.typescript code>",
							type: function() {
								return {
									media: "application",
									subtype: "x.typescript",
									parameters: {}
								}
							},
							read: function() {
								return code;
							}
						});
						if (!maybe.present) throw new Error("Unable to compile TypeScript.");
						return maybe.value.js;
					}
				};
			}
		})
	}
//@ts-ignore
)(jsh,$slime,plugin);
