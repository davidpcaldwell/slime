//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages, jsh) {
		var mode = jsh.script.arguments[0];
		var marker = jsh.file.Pathname(jsh.script.arguments[1]);
		if (!marker.file) {
			marker.write("relaunching", { append: false });
			if (mode == "identity") {
				jsh.shell.jsh.relaunch();
			} else if (mode == "transform") {
				jsh.shell.jsh.relaunch(function(intention) {
					if (!("package" in intention) || intention.package != jsh.script.file.pathname.toString()) {
						throw new Error("Expected the current package in the relaunch intention");
					}
					intention.arguments = ["transformed", marker.toString(), "changed"];
					return intention;
				});
			} else {
				throw new Error("Unexpected initial mode: " + mode);
			}
			throw new Error("Relaunch returned");
		}
		if (mode != "identity" && mode != "transformed") throw new Error("Unexpected child mode: " + mode);
		jsh.shell.echo(JSON.stringify({
			arguments: jsh.script.arguments,
			package: jsh.script.file.pathname.toString(),
			directory: String(new Packages.java.io.File(".").getCanonicalPath()),
			environment: jsh.shell.environment.SLIME_RELAUNCH_TEST,
			javaVersion: String(Packages.java.lang.System.getProperty("java.version"))
		}));
		jsh.shell.exit(23);
	}
//@ts-ignore
)(Packages, jsh);
