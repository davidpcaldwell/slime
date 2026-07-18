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
		jsh.loader.plugins(jsh.script.file.parent);

		jsh.project.suite.initialize({
			selenium: false
		});

		jsh.script.cli.main(
			$api.fp.pipe(
				function(p) {
					// TODO: force CoffeeScript for verification?

					var jrunscript = (
						function() {
							var jdk = jsh.shell.java.Jdk.from.javaHome();
							var pathname = jsh.shell.java.Jdk.jrunscript(jdk);
							if (!pathname.present) throw new Error("Could not resolve jrunscript for JDK home: " + jdk.base);
							return pathname.value;
						}
					)();

					var engine = (
						function() {
							//	TODO	this is kind of clunky and seems to indicate a less clunky API should be available to get this
							//			string
							var ENGINE = jsh.internal.bootstrap.engine.resolve({
								rhino: function() { return "rhino"; },
								nashorn: function() { return "nashorn"; },
								graal: function() { return "graal"; }
							});
							var engine = ENGINE();
							return engine;
						}
					)();

					var SLIME = $api.fp.now(jsh.script.world.file, jsh.file.Location.parent(), jsh.file.Location.parent());

					var HERE = $api.fp.now(jsh.script.world.file, jsh.file.Location.parent());

					jsh.shell.console("Running " + jsh.shell.jsh.src + " with jrunscript " + jrunscript + " and engine " + engine + " ...");

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
