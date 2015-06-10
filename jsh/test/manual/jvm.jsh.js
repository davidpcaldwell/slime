//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		run: false,
		shell: jsh.script.getopts.ARRAY(jsh.file.Pathname),
		jre: jsh.script.getopts.ARRAY(jsh.file.Pathname)
	}
});

//	TODO	if no -shell specified, use the current shell
//	TODO	if no -jre specified, use the current JRE

if (parameters.options.run) {
//	var properties = Packages.java.lang.System.getProperties();
//	var names = properties.keys();
//	while(names.hasNext()) {
//		var name = names.next();
//		jsh.shell.echo(name + " = " + properties.get(name));
//	}
	jsh.shell.echo("Java: " + jsh.shell.java.version + " " + jsh.shell.java.vm.name + " " + jsh.shell.java.vm.version);
	jsh.shell.echo("OS: " + jsh.shell.os.name + " " + jsh.shell.os.version + " " + jsh.shell.os.arch);
	jsh.shell.echo("jsh: " + jsh.shell.jsh.home);
} else {
	var shells = parameters.options.shell;
	if (!shells.length) {
		shells = [jsh.shell.jsh.home.pathname];
	}
	var jres = parameters.options.jre;
	if (!jres.length) {
		jres = [jsh.shell.java.home.pathname];
	}

	var time = function() {
		var start = new Date().getTime();
		jsh.shell.shell.apply(jsh.shell,arguments);
		var end = new Date().getTime();
		jsh.shell.echo("Elapsed: " + ((end - start)/1000).toFixed(3) + " seconds.");
		jsh.shell.echo();
	}

	shells.forEach(function(shell) {
		var searchpath = jsh.file.Searchpath([shell]);
		if (searchpath.getCommand("jsh")) {
			//	native
			jsh.shell.echo("Using native launcher: " + searchpath.getCommand("jsh"));
			time(
				searchpath.getCommand("jsh").pathname,
				[
					jsh.script.file.pathname, "-run"
				]
			);
		}
		jres.forEach(function(jre) {
			var searchpath = jsh.file.Searchpath([jre.directory.getRelativePath("bin")]);
			time(
				searchpath.getCommand("java").pathname,
				[
					"-client",
					"-jar", shell.directory.getRelativePath("jsh.jar"),
					jsh.script.file.pathname, "-run"
				]
			);
		});
	});
}