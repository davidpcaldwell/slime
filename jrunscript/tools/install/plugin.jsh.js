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
				return Boolean(jsh.js && jsh.web && jsh.java && jsh.ip && jsh.time && jsh.file && jsh.http && jsh.shell && jsh.java.tools);
			},
			load: function() {
				if (!jsh.tools) jsh.tools = {
					plugin: void(0),

					git: void(0),
					hg: void(0),
					node: void(0),
					install: void(0),
					github: void(0),
					gradle: void(0),
					docker: void(0),
					kubectl: void(0),
					code: void(0),
					jenkins: void(0),
					gcloud: void(0),
					maven: void(0),


					//	deprecated
					rhino: void(0),
					tomcat: void(0),
					ncdbg: void(0)
				};
				/** @type { slime.jrunscript.tools.install.Script } */
				var script = $loader.script("module.js");
				jsh.tools.install = script({
					library: {
						shell: jsh.shell,
						http: jsh.http,
						file: jsh.file,
						web: jsh.web,
						install: jsh.java.tools
					},
					downloads: jsh.shell.user.downloads
				});
			}
		});
	}
//@ts-ignore
)(jsh,$loader,plugin);
