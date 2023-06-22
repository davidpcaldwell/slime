//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.plugin.Scope["plugins"] } plugins
	 * @param { slime.jsh.Global } jsh
	 * @param { slime.jsh.plugin.$slime } $slime
	 * @param { slime.Loader } $loader
	 * @param { slime.jsh.plugin.plugin } plugin
	 */
	function($api,plugins,jsh,$slime,$loader,plugin) {
		plugin({
			isReady: function() {
				return Boolean(jsh.js && jsh.document && jsh.js.document && jsh.web && jsh.java && jsh.io && jsh.file);
			},
			load: function() {
				/**
				 *
				 * @param { slime.jrunscript.runtime.io.OutputStream } outputStream
				 * @returns { slime.jrunscript.shell.context.OutputStream }
				 */
				var toShellContextOutputStream = function(outputStream) {
					return {
						character: function() {
							return outputStream.character();
						},
						java: {
							adapt: function() {
								return outputStream.java.adapt();
							}
						},
						split: function(other) {
							return outputStream.split(other);
						}
					}
				};

				var stdio = {
					input: jsh.io.Streams.java.adapt($slime.getStdio().getStandardInput()),
					output: toShellContextOutputStream(jsh.io.Streams.java.adapt($slime.getStdio().getStandardOutput())),
					error: toShellContextOutputStream(jsh.io.Streams.java.adapt($slime.getStdio().getStandardError()))
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

				/** @type { slime.jrunscript.shell.Script } */
				var script = $loader.script("module.js");

				var module = script(mContext);

				if (!module.properties) throw new TypeError();

				//	TODO	undoubtedly a better way to do this than having two separate arguments
				plugins.shell = module;
				plugins.stdio = stdio;
			}
		});
	}
//@ts-ignore
)($api,plugins,jsh,$slime,$loader,plugin);
