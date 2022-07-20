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
	 * @param { slime.jsh.internal.launcher.test.Context } $context
	 * @param { slime.loader.Export<slime.jsh.internal.launcher.test.Exports> } $export
	 */
	function($api,$context,$export) {
		var getEngines = function(src) {
			var engines = $context.library.shell.run({
				command: "bash",
				arguments: [src.getFile("jsh.bash"), "-engines"],
				stdio: {
					output: String
				},
				evaluate: function(result) {
					return JSON.parse(result.stdio.output);
				}
			});
			return engines;
		}

		/**
		 *
		 * @param { slime.jrunscript.file.Directory } src
		 * @param { slime.jrunscript.file.Pathname } rhino
		 * @returns { slime.$api.fp.world.Action<slime.jrunscript.file.Directory,{ console: string }> }
		 */
		var _buildShell = function(src,rhino) {
			return function(tmpdir) {
				return function(events) {
					var buildArguments = [];
					if (rhino) {
						buildArguments.push("-rhino", rhino);
					}
					$context.library.shell.run({
						command: $context.library.shell.java.jrunscript,
						arguments: [
							src.getRelativePath("rhino/jrunscript/api.js"),
							"jsh",
							src.getRelativePath("jsh/etc/build.jsh.js"),
							tmpdir,
							"-notest",
							"-nodoc"
						].concat(buildArguments),
						environment: $api.Object.compose(
							{
								//	TODO	next two lines duplicate logic in jsh.test plugin
								TEMP: ($context.library.shell.environment.TEMP) ? $context.library.shell.environment.TEMP : "",
								PATHEXT: ($context.library.shell.environment.PATHEXT) ? $context.library.shell.environment.PATHEXT : "",
								PATH: $context.library.shell.environment.PATH.toString()
							},
							($context.library.shell.environment.JSH_SHELL_LIB) ? { JSH_SHELL_LIB: $context.library.shell.environment.JSH_SHELL_LIB } : {}
						)
					});
					events.fire("console", "Build successful.");
				}
			}
		}

		/** @type { slime.jsh.internal.launcher.test.Exports["verifyOutput"] } */
		function verifyOutput(configuration) {
			return function(verify) {
				return function(result) {
					if (configuration.isUnbuilt) {
						verify(result).src.is.not(null);
						verify(result).home.is(null);
					} else {
						verify(result).src.is(null);
						verify(result).home.is.not(null);
					}
					verify(result).logging.is("/foo/bar");
					verify(result).foo1.is("bar");
					verify(result).foo2.is("baz");
					verify(result).rhino.running.is( configuration.isRhino );
					if (configuration.hasRhino) {
						verify(result).rhino.classpath.is.not(null);
					} else {
						//	TODO	below comment seems wrong; the whole point of .hasRhino is that we do know, right?
						//	We do not know; we could have been run inside a shell that has Rhino installed
						//	verify(result).rhino.classpath.is(null);
					}
					verify(result).tmp.is(configuration.tmp.toString());
				}
			}
		}

		$export({
			getEngines: getEngines,
			buildShell: _buildShell,
			verifyOutput: verifyOutput
		})
	}
//@ts-ignore
)($api,$context,$export);
