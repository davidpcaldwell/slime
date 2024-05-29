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
	 * @param { slime.jsh.plugin.Scope["plugin"] } plugin
	 */
	function(jsh,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.shell && jsh.tools && jsh.tools.install);
			},
			load: function() {
				/** @type { slime.jrunscript.tools.maven.Script } */
				var script = $loader.script("module.js");
				jsh.tools.maven = script({
					mvn: jsh.shell.PATH.getCommand("mvn"),
					HOME: jsh.shell.HOME,
					java: jsh.shell.java,
					jsh: jsh,
					library: {
						document: jsh.document,
						file: jsh.file,
						shell: jsh.shell,
						install: jsh.tools.install
					}
				});
			}
		});
	}
//@ts-ignore
)(jsh,$loader,plugin);
