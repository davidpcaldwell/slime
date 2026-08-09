//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var plugin = (
			function() {
				jsh.loader.plugins(jsh.script.file.parent);
				return jsh.project.suite;
			}
		)();

		plugin.initialize({
			selenium: false
		});

		jsh.script.cli.main(
			$api.fp.pipe(
				function(p) {
					var jrunscript = $api.fp.now(
						jsh.shell.java.Jdk.from.javaHome,
						$api.fp.build(
							jsh.shell.java.Jdk.jrunscript,
							$api.fp.Partial.impure.exception(function(jdk) {
								return new Error("Could not resolve jrunscript for JDK home: " + jdk.base);
							})
						)
					);

					//	TODO	code smell, this value should be directly accessible
					var engine = jsh.internal.bootstrap.engine.resolve({
						rhino: "rhino",
						nashorn: "nashorn",
						graal: "graal"
					});

					var HERE = $api.fp.now(jsh.script.world.file, jsh.file.Location.parent());
					var SLIME = $api.fp.now(HERE, jsh.file.Location.parent());

					jsh.shell.console("Running " + SLIME.pathname + " with jrunscript " + jrunscript + " and engine " + engine + " ...");

					var run = $api.fp.now(
						jsh.shell.subprocess.question,
						$api.fp.world.Sensor.mapping()
					);

					var result = run({
						command: "bash",
						arguments: [
							$api.fp.now(SLIME, jsh.file.Location.directory.relativePath("fifty"), $api.fp.property("pathname")),
							"test.jsh",
							$api.fp.now(HERE, jsh.file.Location.directory.relativePath("jrunscript.fifty.ts"), $api.fp.property("pathname"))
						]
					});

					return result.status;
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
