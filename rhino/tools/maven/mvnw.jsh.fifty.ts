//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The `mvn.jsh.js` `jsh` script can be used to install the Maven wrapper into an existing project, or to create a new
 * Maven-wrapper-enabled project from a Maven archetype.
 *
 * The script will download and install Maven in order to bootstrap the archtype and wrapper commands, unless one is specified
 * via the `--maven:program <path-to-mvn-executable>` command-line switch.
 *
 * The script consumes the following command-line arguments:
 *
 * * `--maven:program <pathname>`: the location of the `mvn` launcher to use; otherwise, a Maven will be downloaded and used
 * * `--archetype <name>`: The standard Maven archetype to use. Currently, only `quickstart` is supported.
 * * `--project <pathname>`: **Required.** The project to wrap (or the location at which to generate the project to wrap).
 * * `--maven:archetype:argument <argument>`: (can be repeated) Add the given argument to the arguments passed to the
 * Maven `archetype:generate` command. For `quickstart`, at least `-DgroupId=`, `-DartifactId=`, and `-Dversion=` arguments are
 * needed.
 */
namespace slime.jrunscript.tools.maven.script.mvnw {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.wip = function() {
				var project = jsh.file.os.temporary.pathname();

				var srcFile = $api.fp.now(
					fifty.jsh.file.relative("../../.."),
					jsh.file.Location.directory.base,
					function(base) {
						return $api.fp.pipe(base, $api.fp.property("pathname"))
					}
				);

				$api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: {
						command: "bash",
						arguments: $api.Array.build(function(rv: string[]) {
							rv.push( srcFile("jsh") );
							rv.push( srcFile("rhino/tools/maven/mvnw.jsh.js") );
							rv.push( "--archetype", "quickstart" );
							rv.push( "--project", project );
							rv.push( "--maven:archetype:argument", "-DgroupId=foo.bar" );
							rv.push( "--maven:archetype:argument", "-DartifactId=baz" );
							rv.push( "--maven:archetype:argument", "-Dversion=0.0.1-SNAPSHOT" );
						}),
						environment: function(was) {
							return $api.Object.compose(was);
						},
						stdio: {
							output: "line",
							error: "line"
						}
					},
					handlers: {
						stderr: function(e) {
							jsh.shell.console("STDERR: " + e.detail.line);
						},
						stdout: function(e) {
							jsh.shell.console("STDOUT: " + e.detail.line);
						}
					}
				});

				$api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: {
						command: $api.fp.now(project, jsh.file.os.directory.relativePath("mvnw")),
						arguments: $api.Array.build(function(rv: string[]) {
							rv.push("install");
						}),
						environment: function(was) {
							return $api.Object.compose(was, { JAVA_HOME: jsh.shell.java.Jdk.from.javaHome().base });
						},
						directory: project,
						stdio: {
							output: "line",
							error: "line"
						}
					},
					handlers: {
						stderr: function(e) {
							jsh.shell.console("mvnw install STDERR: " + e.detail.line);
						},
						stdout: function(e) {
							jsh.shell.console("mvnw install STDOUT: " + e.detail.line);
						}
					}
				});

				jsh.shell.console("project = " + project);
			}
		}
	//@ts-ignore
	)(fifty);
}
