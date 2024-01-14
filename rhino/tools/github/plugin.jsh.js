//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(Packages,$api,jsh,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.web && jsh.http && jsh.unit.mock.Web && jsh.unit.mock.web);
			},
			load: function() {
				var code = {
					/** @type { slime.jsh.unit.mock.github.web.Script } */
					mock: $loader.script("mock.js")
				};
				var mock = code.mock({
					jsh: jsh
				});

				jsh.unit.mock.Web.github = mock;
				$api.deprecate(jsh.unit.mock.Web, "github");
				jsh.unit.mock.web.Github = mock;
			}
		})
	}
//@ts-ignore
)(Packages,$api,jsh,$loader,plugin)
