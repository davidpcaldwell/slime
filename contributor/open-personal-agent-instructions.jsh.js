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
					var devcontainerHome = $api.fp.now(
						jsh.shell.HOME.pathname.os.adapt(),
						jsh.file.Location.directory.relativePath(".agents")
					);
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
						devcontainer: $api.fp.now(devcontainerHome, jsh.file.Location.directory.relativePath("README.md")),
						host: $api.fp.now(hostLocation, jsh.file.Location.directory.relativePath("README.md"))
					};
					var fileExists = jsh.file.Location.file.exists.simple;
					var locations = (
						function() {
							if (fileExists(readmeLocations.host)) {
								return {
									program: p.options.execPath,
									file: readmeLocations.host.pathname
								};
							} else if (fileExists(readmeLocations.devcontainer)) {
								return {
									program: "code",
									file: readmeLocations.devcontainer.pathname
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
						jsh.shell.console("locations.devcontainer: " + readmeLocations.devcontainer.pathname);
						jsh.shell.exit(1);
					}
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
