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
				/**
				 * We want to wait until the curl plugin is loaded if curl is present (otherwise, it will never load).
				 *
				 * @type { () => boolean }
				 */
				var isCurlDependencySatisfied = function() {
					if (!jsh.shell) return false;
					var curlPresent = jsh.shell.PATH.getCommand("curl");
					if (!curlPresent) return true;
					return Boolean(jsh.http.curl);
				}

				return Boolean(jsh.web && jsh.http && isCurlDependencySatisfied() && jsh.io && jsh.file && jsh.shell && jsh.tools && jsh.tools.install);
			},
			load: function() {
				/** @type { slime.jrunscript.tools.docker.Script } */
				var load = $loader.script("module.js");
				var module = load({
					library: {
						web: jsh.web,
						http: jsh.http,
						curl: jsh.http.curl,
						file: jsh.file,
						shell: jsh.shell
					}
				});

				var location = jsh.file.Pathname("/Applications/Docker.app");

				jsh.tools.docker = {
					engine: module.engine,
					require: function() {
						return module.install({
							library: {
								shell: jsh.shell,
								install: jsh.tools.install
							},
							sudo: {
								askpass: jsh.shell.jsh.src.getFile("rhino/shell/sudo-askpass.bash")
							},
							destination: location
						})
					}
				};

				/**
				 *
				 * @param { slime.jsh.Global["shell"] } shell
				 * @returns { slime.jsh.Tools["kubectl"]["json"] }
				 */
				var jshFacade = function(shell) {
					/**
					 * @param { slime.jrunscript.tools.kubernetes.cli.Invocation } invocation
					 */
					function rv(invocation) {
						var installation = module.kubectl.Installation({ command: "kubectl" });
						var environment = installation.Environment.create({
							environment: shell.environment,
							stdio: shell.stdio,
							directory: shell.PWD.toString()
						});
						var run = environment.Invocation.create(
							module.kubectl.Invocation.toJson(invocation)
						);
						var postprocessor = module.kubectl.result(shell.world, run);
						return postprocessor;
					}
					return rv;
				};

				jsh.tools.kubectl = Object.assign(module.kubectl, {
					json: jshFacade(jsh.shell)
				});
			}
		})
	}
//@ts-ignore
)(jsh,$loader,plugin);
