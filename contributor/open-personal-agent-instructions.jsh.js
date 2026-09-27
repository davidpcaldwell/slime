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
		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.option.string({ longname: "execPath" }),
				function(p) {
					var devcontainerLocation = jsh.file.Location.from.os("/config/.agents");
					var homeLocation = (jsh.shell.environment.HOME)
						? $api.fp.now(
							jsh.file.Location.from.os(jsh.shell.environment.HOME),
							jsh.file.Location.directory.relativePath(".slime/contributor/agents")
						)
						: void(0)
					;
					var hostLocation = $api.fp.now(
						jsh.script.world.file,
						jsh.file.Location.parent(),
						jsh.file.Location.parent(),
						jsh.file.Location.directory.relativePath("local/agents")
					);
					var run = $api.fp.now(
						jsh.shell.subprocess.action,
						$api.fp.world.Means.effector()
					);
					var readmeLocations = {
						devcontainer: $api.fp.now(devcontainerLocation, jsh.file.Location.directory.relativePath("README.md")),
						home: (homeLocation) ? $api.fp.now(homeLocation, jsh.file.Location.directory.relativePath("README.md")) : void(0),
						host: $api.fp.now(hostLocation, jsh.file.Location.directory.relativePath("README.md"))
					};
					var fileExists = jsh.file.Location.file.exists.simple;
					var locations = (
						function() {
							if (fileExists(readmeLocations.devcontainer)) {
								return {
									program: "code",
									file: readmeLocations.devcontainer.pathname
								};
							} else if (fileExists(readmeLocations.host)) {
								return {
									program: p.options.execPath || "code",
									file: readmeLocations.host.pathname
								};
							} else if (readmeLocations.home && fileExists(readmeLocations.home)) {
								return {
									program: p.options.execPath || "code",
									file: readmeLocations.home.pathname
								};
							} else {
								return void(0);
							}
						}
					)();
					if (locations) {
						run({
							command: locations.program,
							arguments: [locations.file]
						});
					} else {
						jsh.shell.console("Did not find README.md for agents.");
						jsh.shell.console("locations.host: " + readmeLocations.host.pathname);
						if (readmeLocations.home) jsh.shell.console("locations.home: " + readmeLocations.home.pathname);
						jsh.shell.console("locations.devcontainer: " + readmeLocations.devcontainer.pathname);
						jsh.shell.exit(1);
					}
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
