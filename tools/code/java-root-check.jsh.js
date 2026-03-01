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
				function(program) {
					var project = jsh.tools.code.Project.from.root({ root: jsh.shell.PWD.pathname.os.adapt(), git: { submodules: false } });
					jsh.shell.console("Project root: " + project.base.pathname);

					var toLocation = jsh.file.Location.directory.base(project.base);

					var declared = $api.fp.now(
						project.base,
						jsh.file.Location.directory.relativePath(".vscode/settings.json"),
						jsh.file.Location.file.read.string.simple,
						function(s) {
							return s.split("\n").slice(6).join("\n");
						},
						function(s) {
							return s.split("\n").filter(function(line) { return !/^(\s*)\/\//.test(line); }).join("\n");
						},
						$api.fp.impure.tap(jsh.shell.console),
						JSON.parse,
						function(settings) { return settings["java.project.sourcePaths"] },
						$api.fp.Array.map(toLocation)
					);

					jsh.shell.console("Declared source roots:");
					declared.forEach(function(location) {
						jsh.shell.console("- " + location.pathname);
					});

					for (var i=0; i<project.files.length; i++) {
						var file = project.files[i];
						if (/\.java$/.test(file.pathname)) {
							//jsh.shell.console("Found Java file: " + file.pathname);
						} else {
							continue;
						}
						var under = declared.some(function(location) {
							return file.pathname.substring(0, location.pathname.length+1) == location.pathname + "/";
						});
						if (!under) {
							jsh.shell.console("Java file not under declared source root: " + file.pathname);
						}
					}
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
