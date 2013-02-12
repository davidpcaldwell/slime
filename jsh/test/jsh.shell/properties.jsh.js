//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var log = function(string) {
	jsh.shell.echo(string, {
		stream: jsh.io.Streams.stderr
	});
}

//	TODO	could more robustly check values below; this pretty much just outputs them and makes sure the appropriate parent objects
//			exist
log("TMPDIR = " + jsh.shell.TMPDIR);
log("USER = " + jsh.shell.USER);
log("PWD = " + jsh.shell.PWD);
log("HOME = " + jsh.shell.HOME);
log("PATH = " + jsh.shell.PATH);
log("os.name = " + jsh.shell.os.name);
log("os.arch = " + jsh.shell.os.arch);
log("os.version = " + jsh.shell.os.version);
log("java.home = " + jsh.shell.java.home);
log("java.version = " + jsh.shell.java.version);
log("java.vendor = " + jsh.shell.java.vendor);
log("java.vendor.url = " + jsh.shell.java.vendor.url);
log("java.vm.specification.version = " + jsh.shell.java.vm.specification.version);
log("java.vm.specification.vendor = " + jsh.shell.java.vm.specification.vendor);
log("java.vm.specification.name = " + jsh.shell.java.vm.specification.name);
log("java.vm.version = " + jsh.shell.java.vm.version);
log("java.vm.vendor = " + jsh.shell.java.vm.vendor);
log("java.vm.name = " + jsh.shell.java.vm.name);
log("java.specification.version = " + jsh.shell.java.specification.version);
log("java.specification.vendor = " + jsh.shell.java.specification.vendor);
log("java.specification.name = " + jsh.shell.java.specification.name);
log("java.class.version = " + jsh.shell.java["class"].version);
log("java.class.path = " + jsh.shell.java["class"].path);
log("java.library.path = " + jsh.shell.java.library.path);
log("java.compiler = " + jsh.shell.java.compiler);
log("java.ext.dirs = " + jsh.shell.java.ext.dirs);

if (typeof(jsh.shell.PATH) == "undefined") {
	throw new Error("PATH should be defined.");
}
if (typeof(jsh.shell.environment.PATH) == "undefined") {
	if (jsh.shell.PATH.pathnames.length > 0) {
		throw new Error("PATH should be empty.");
	}
}
jsh.shell.echo("Passed.");
