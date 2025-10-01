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
				jsh.script.cli.fp.option.location({ longname: "maven:program" }),
				jsh.script.cli.option.string({ longname: "archetype" }),
				jsh.script.cli.fp.option.location({ longname: "project" }),
				jsh.script.cli.option.array({
					longname: "maven:archetype:argument",
					value: $api.fp.identity
				}),
				function(p) {
					if (!p.options.project.present) {
						jsh.shell.console("Required: --project <project-pathname>.");
						return 1;
					}
					var project = p.options.project.value.pathname;

					if (!p.options.archetype) {
						p.options.archetype = "quickstart";
					}

					if (p.options.archetype != "quickstart") {
						jsh.shell.console("Currently, only maven-archetype-quickstart is supported.");
						return 1;
					}

					var mvn = $api.fp.now(
						p.options["maven:program"],
						$api.fp.now(
							$api.fp.Maybe.map($api.fp.property("pathname")),
							$api.fp.Partial.else(function() {
								var tmp = jsh.file.os.temporary.pathname();
								$api.fp.world.Means.now({
									means: jsh.tools.maven.Installation.require.world,
									order: {
										installation: {
											home: tmp
										},
										version: "3.9.7"
									},
									handlers: {
										installed: function(e) {
											jsh.shell.console("Installed: Maven " + e.detail.version);
										}
									}
								});

								return $api.fp.now(tmp, jsh.file.os.directory.relativePath("bin/mvn"));
							})
						)
					);

					var jdk = jsh.shell.java.Jdk.from.javaHome();

					if (p.options.archetype) {
						jsh.shell.console("Generating project from archetype ...");
						var tmp = jsh.file.os.temporary.directory();
						var a = $api.fp.world.Sensor.now({
							sensor: jsh.shell.subprocess.question,
							subject: {
								command: mvn,
								arguments: $api.Array.build(function(rv) {
									rv.push("archetype:generate");

									rv.push("-DinteractiveMode=false");

									rv.push("-DarchetypeGroupId=org.apache.maven.archetypes");
									rv.push("-DarchetypeArtifactId=" + "maven-archetype-" + p.options.archetype);

									p.options["maven:archetype:argument"].forEach(function(value) {
										rv.push(value);
									});
								}),
								directory: tmp,
								environment: function(existing) {
									return $api.Object.compose(existing, { JAVA_HOME: jdk.base });
								}
							}
						});
						if (a.status) return a.status;
						var contents = $api.fp.now(
							tmp,
							jsh.file.Location.from.os,
							jsh.file.Location.directory.list.stream.simple(),
							$api.fp.Stream.collect
						);
						//	TODO	unreachable
						if (contents.length != 1) throw new Error();
						$api.fp.world.Means.now({
							means: jsh.file.Filesystem.move,
							order: {
								filesystem: jsh.file.world.filesystems.os,
								from: contents[0].pathname,
								to: project
							}
						});
					}

					$api.fp.world.Sensor.now({
						sensor: jsh.shell.subprocess.question,
						subject: {
							command: mvn,
							arguments: ["wrapper:wrapper"],
							directory: project,
							environment: function(existing) {
								return $api.Object.compose(existing, { JAVA_HOME: jdk.base });
							}
						}
					});

					jsh.shell.console("Maven wrapper added to " + project + ".");
				}
			)
		)
	}
//@ts-ignore
)($api,jsh);
