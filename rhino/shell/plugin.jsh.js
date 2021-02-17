//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { Packages } Packages
	 * @param { jsh } jsh
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function(Packages,jsh,$slime,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.js && jsh.document && jsh.js.document && jsh.js.web && jsh.java && jsh.io && jsh.file);
			},
			load: function() {
				var stdio = {
					input: jsh.io.Streams.java.adapt($slime.getStdio().getStandardInput()),
					output: jsh.io.Streams.java.adapt($slime.getStdio().getStandardOutput()),
					error: jsh.io.Streams.java.adapt($slime.getStdio().getStandardError())
				}

				var code = {
					/** @type { slime.jrunscript.shell.Loader } */
					module: $loader.factory("module.js")
				}

				var mContext = {
					api: {
						js: jsh.js,
						java: jsh.java,
						io: jsh.io,
						file: jsh.file,
						document: jsh.js.document,
						httpd: void(0),
						xml: {
							parseFile: function(file) {
								return new jsh.document.Document({ string: file.read(String) });
							}
						},
						ui: void(0)
					},
					_properties: $slime.getSystemProperties(),
					_environment: $slime.getEnvironment(),
					kotlin: ($slime.getLibraryFile("kotlin")) ? {
						compiler: jsh.file.Pathname( String($slime.getLibraryFile("kotlin/bin/kotlinc").getAbsolutePath()) ).file
					} : null,
					stdio: stdio
				};

				//	TODO	necessary because dependencies are entangled here
				Object.defineProperty(mContext.api, "ui", {
					get: function() {
						return jsh.ui;
					}
				});

				var module = code.module(mContext);

				if (!module.properties) throw new TypeError();

				/**
				 * @type { slime.jsh.shell.internal.Context }
				 */
				var context = {
					api: {
						js: jsh.js
						,java: jsh.java
						,io: jsh.io
						,file: jsh.file
						,script: void(0)
					},
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
					}
				};

				//	TODO	necessary because dependencies are entangled here
				Object.defineProperty(context.api, "script", {
					get: function() {
						return jsh.script;
					}
				});

				$loader.run(
					"jsh.js",
					{
						$context: context,
						$exports: module
					}
				);

				/** @returns { slime.jsh.shell.Exports & { getopts: any } } */
				var toJsh = function(api) {
					return api;
				}

				jsh.shell = toJsh(module);
			}
		});

		plugin({
			isReady: function() {
				return Boolean(jsh.shell && jsh.httpd);
			},
			load: function() {
				jsh.shell.browser.inject({ httpd: jsh.httpd });
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
		})
	}
//@ts-ignore
)(Packages,jsh,$slime,$loader,plugin);
