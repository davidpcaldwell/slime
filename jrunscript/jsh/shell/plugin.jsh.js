//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.plugin.Scope["plugins"] } plugins
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(Packages,$api,plugins,jsh,$slime,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(plugins.shell && plugins.stdio && jsh.internal && jsh.internal.bootstrap && jsh.script);
			},
			load: function() {
				/** @type { slime.jrunscript.shell.Exports } */
				var module = plugins.shell;

				/** @type { slime.jrunscript.shell.context.Stdio } */
				var stdio = plugins.stdio;

				/**
				 * @type { slime.jsh.shell.internal.Context }
				 */
				var context = {
					api: {
						js: jsh.js,
						java: jsh.java,
						io: jsh.io,
						file: jsh.file,
						script: jsh.script,
						bootstrap: jsh.internal.bootstrap
					},
					PATH: module.PATH,
					stdio: stdio,
					_getSystemProperties: function() {
						return $slime.getSystemProperties();
					},
					exit: function(code) {
						$slime.exit(code);
					},
					jsh: function(configuration,script,args) {
						var _invocation = $slime.getInterface().invocation(
							script.pathname.java.adapt(),
							jsh.java.toJavaArray(args,Packages.java.lang.String,function(s) {
								return new Packages.java.lang.String(s);
							})
						);
						return $slime.jsh(configuration,_invocation)
					},
					packaged: function() {
						if ($slime.getPackaged()) {
							return $api.fp.Maybe.from.some(String($slime.getPackaged().getFile().getCanonicalPath()));
						} else {
							return $api.fp.Maybe.from.nothing();
						}
					},
					module: module
				};

				/** @type { slime.jsh.shell.internal.Script } */
				var script = $loader.script("jsh.js");

				jsh.shell = script(
					context
				);
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.file && jsh.shell);
			},
			load: function() {
				var typescriptInstalled = jsh.shell.jsh.lib && jsh.shell.jsh.lib.getFile("node/bin/tsc");

				if (typescriptInstalled) {
					/** @type { slime.jsh.shell.internal.tsc.Script } */
					var script = $loader.script("tsc.js");
					var api = script({
						node: jsh.shell.jsh.lib.getRelativePath("node").toString(),
						tsc: jsh.shell.jsh.lib.getRelativePath("node/bin/tsc").toString(),
						library: {
							file: jsh.file,
							shell: jsh.shell
						}
					});

					/** @type { slime.runtime.loader.Compiler<slime.runtime.loader.Code> } */
					var subprocess = $api.scripts.Compiler.from.simple({
						accept: $api.scripts.Code.isMimeType("application/x.typescript"),
						name: function(code) { return code.name; },
						read: function(code) { return code.read(); },
						compile: api.compile
					});

					$slime.compiler.update(
						function(was) {
							return $api.fp.switch([
								subprocess,
								was
							])
						}
					)
				}
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.shell && jsh.ui && jsh.shell.os);
			},
			load: function() {
				if (jsh.shell.os.sudo) jsh.shell.os.sudo.gui = function(p) {
					if (!p) p = { prompt: void(0) };
					if (!p.prompt) p.prompt = "Account password for " + jsh.shell.environment.USER + ":";
					return function() {
						return jsh.ui.askpass.gui({ prompt: p.prompt });
					};
				}
				if (jsh.shell.os.inject) jsh.shell.os.inject({ ui: jsh.ui });
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.shell && jsh.httpd);
			},
			load: function() {
				jsh.shell.inject.httpd(jsh.httpd);
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.js && jsh.shell && jsh.shell.jsh && jsh.script)
			},
			load: function() {
				jsh.shell.jsh.debug = function(p) {
					var isRhino = (function() {
						//	TODO	probably a way to get this from rhino/jrunscript/api.js
						if (!jsh.java.getClass("org.mozilla.javascript.Context")) return false;
						if (!Packages.org.mozilla.javascript.Context.getCurrentContext()) return false;
						return true;
					})();

					//	TODO	probably want to build these arguments better so that other jsh.shell.jsh arguments like stdio and
					//			environment can also be used and still work

					var evaluate = function(result) {
						jsh.shell.exit(result.status);
					};

					if (isRhino) {
						jsh.shell.jsh({
							script: jsh.script.file,
							arguments: jsh.script.arguments,
							environment: jsh.js.Object.set({}, jsh.shell.environment, {
								JSH_DEBUG_SCRIPT: "rhino"
							}),
							evaluate: evaluate
						})
					} else {
						jsh.shell.jsh({
							script: jsh.shell.jsh.src.getFile("jsh/tools/ncdbg.jsh.js"),
							arguments: [jsh.script.file.toString()].concat(jsh.script.arguments),
							evaluate: evaluate
						});
					}
				}
			}
		});
	}
//@ts-ignore
)(Packages,$api,plugins,jsh,$slime,$loader,plugin);
