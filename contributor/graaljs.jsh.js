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
		var src = $api.fp.now(jsh.shell.context.java.directory, jsh.file.Location.from.os);
		var tmp = $api.fp.now(jsh.file.world.filesystems.os.temporary, $api.fp.world.Sensor.mapping())({ directory: true });
		var m2 = $api.fp.now(jsh.file.world.filesystems.os.temporary, $api.fp.world.Sensor.mapping())({ directory: true });
		/** @type { slime.jsh.shell.Intention } */
		var intention = {
			shell: {
				src: src.pathname
			},
			script: $api.fp.now(src, jsh.file.Location.directory.relativePath("rhino/tools/maven/mvnw.jsh.js")).pathname,
			arguments: $api.Array.build(function(rv) {
				rv.push("--archetype", "quickstart");
				rv.push("--project", tmp);
				rv.push("--maven:archetype:argument", "-DgroupId=foo");
				rv.push("--maven:archetype:argument", "-DartifactId=bar");
				rv.push("--maven:archetype:argument", "-Dversion=0");
				rv.push("--maven:archetype:argument", "-Dmaven.repo.local=" + m2);
			})
		};
		var shellIntention = jsh.shell.jsh.Intention.toShellIntention(intention);
		var run = $api.fp.now(jsh.shell.subprocess.question, $api.fp.world.Sensor.mapping());
		var exit = run(shellIntention);
		jsh.shell.console("tmp = " + tmp + " m2=" + m2);
	}
//@ts-ignore
)($api,jsh);
