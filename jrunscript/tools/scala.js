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
	 * @param { slime.jrunscript.tools.scala.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.scala.Exports> } $export
	 */
	function($api,$context,$export) {
		/** @type { slime.jrunscript.shell.run.Intention["environment"] } */
		var prependJavaToPath = function(existingEnvironment) {
			//	TODO	should be refactoring this out of existence but if not there must be a
			//			better API
			var PATH = $context.library.file.Searchpath(existingEnvironment.PATH.split(":").map($context.library.file.Pathname)).pathnames;
			PATH.splice(0, 0, $context.library.shell.java.launcher.parent.pathname);
			return $api.Object.compose(existingEnvironment, { PATH: $context.library.file.Searchpath(PATH).toString() });
		};

		/** @type { slime.jrunscript.tools.scala.Exports["Installation"] } */
		var Installation = {
			getVersion: function(installation) {
				return function(events) {
					return $api.fp.now.invoke(
						installation,
						$api.fp.property("base"),
						$context.library.file.world.Location.from.os,
						$context.library.file.world.Location.relative("bin/scala"),
						$api.fp.switch([
							$api.fp.Partial.match({
								if: $api.fp.world.mapping($context.library.file.world.Location.file.exists()),
								then: $api.fp.identity
							})
						]),
						$api.fp.Maybe.map(
							$api.fp.pipe(
								function(program) {
									var PATH = $context.library.file.Searchpath($context.library.shell.PATH.pathnames.slice());
									PATH.pathnames.splice(0, 0, $context.library.shell.java.launcher.parent.pathname);
									return $context.library.shell.Invocation.from.argument({
										command: program.pathname,
										arguments: ["-version"],
										environment: $api.Object.compose(
											$context.library.shell.environment,
											{
												PATH: PATH.toString()
											}
										),
										stdio: {
											output: "string",
											error: "string"
										}
									})
								},
								$api.fp.world.mapping($context.library.shell.world.question),
								$api.fp.property("stdio"),
								$api.fp.property("error"),
								function(string) {
									var pattern = /^Scala code runner version ([\d\.]+) (?:.*)/;
									var match = pattern.exec(string);
									if (match === null) throw new TypeError("Could not determine Scala version from output [" + string + "]");
									return match[1];
								}
							)
						)
					)
					return $api.fp.Maybe.nothing();
				}
			},
			compile: function(installation) {
				var o = {
					directory: $context.library.file.Pathname(installation.base).directory
				}
				return function(p) {
					return function(events) {
						//	TODO	scalac will error if this is not done; document it
						if (p.destination) p.destination.createDirectory({
							exists: function() {
								return false;
							}
						});
						var tell = $context.library.shell.subprocess.action({
							command: o.directory.getFile("bin/scalac").toString(),
							arguments: $api.Array.build(function(list) {
								if (p.deprecation) list.push("-deprecation");
								if (p.destination) list.push("-d", p.destination.toString());
								list.push.apply(list,p.files);
							}),
							environment: prependJavaToPath
						});
						tell(events);
					}
				}
			},
			run: function(installation) {
				var o = {
					directory: $context.library.file.Pathname(installation.base).directory
				}
				return function(p) {
					return function(events) {
						//	TODO	possibly could just use java command with location.directory.getRelativePath("lib/scala-library.jar")
						//			in classpath
						var tell = $context.library.shell.subprocess.action({
							command: o.directory.getFile("bin/scala").toString(),
							arguments: $api.Array.build(function(list) {
								if (p.classpath) list.push("-classpath", p.classpath.toString());
								if (p.deprecation) list.push("-deprecation");
								list.push(p.main);
							}),
							environment: prependJavaToPath
						});
						tell(events);
					}
				}
			}
		};

		$export({
			Installation: Installation
		});
	}
//@ts-ignore
)($api,$context,$export);
