//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	TODO	Note that under normal circumstances this file will never be used; the plugin.jsh.js in the parent directory will
//			be processed and stop the search for plugins. This plugin is left in place because callers might potentially attempt
//			to locate it explicitly

//@ts-check
(
	function($api,jsh,$loader,plugin) {
		plugin({
			isReady: function() {
				return jsh.js && jsh.time && jsh.web && jsh.java && jsh.ip && jsh.file && jsh.shell && jsh.tools && jsh.tools.install && jsh.java.tools;
			},
			load: function() {
				/** @type { slime.jrunscript.git.Script } */
				var code = $loader.script("module.js");
				jsh.tools.git = code({
					api: {
						js: jsh.js,
						java: {
							Thread: jsh.java.Thread
						},
						time: jsh.time,
						shell: jsh.shell,
						Error: jsh.js.Error,
						web: jsh.web
					},
					program: void(0),
					environment: void(0),
					console: void(0)
				});
				if (jsh.tools.git.installation) {
					//	TODO	enable credentialHelper for built shells
					//	TODO	investigate enabling credentialHelper for remote shells
					if (jsh.shell.jsh.src) {
						var credentialHelper = [
							jsh.shell.java.jrunscript.toString(),
							jsh.shell.jsh.src.getRelativePath("rhino/jrunscript/api.js"),
							"jsh",
							jsh.shell.jsh.src.getRelativePath("rhino/tools/git/credential-helper.jsh.js")
						].join(" ");
						jsh.tools.git.credentialHelper.jsh = credentialHelper;
					}

					global.git = {};
					["Repository","init"].forEach(function(name) {
						global.git[name] = jsh.tools.git[name];
						$api.deprecate(global.git,name);
					});
					$api.deprecate(global,"git");
				}
			}
		})
	}
//@ts-ignore
)($api,jsh,$loader,plugin)
