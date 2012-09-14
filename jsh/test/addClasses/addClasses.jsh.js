//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.shell.getopts({
	options: {
		classes: jsh.file.Pathname
	}
});

if (!parameters.options.classes) {
	jsh.shell.echo("No -classes argument.");
	jsh.shell.exit(1);
}

var pass = true;

var verify = function(b,message) {
	if (!b) {
		pass = false;
	}
	if (message) {
		jsh.shell.echo(b + " " + message);
	}
}

var getClass = function(name) {
	try {
		return $host.getLoader().getJavaClass(name);
	} catch (e) {
		return null;
	}
}

//	The below line causes the caching behavior of AddClasses to kick in, which makes the final verification (after adding the class)
//	to fail, at least under Rhino 1.7R2
//verify(typeof(Packages.test.AddClasses) == "object", "typeof(Packages.test.AddClasses) == object");
verify(getClass("test.AddClasses") == null, "Class not found");
jsh.loader.addClasses(parameters.options.classes);
jsh.shell.echo("Classes added: " + parameters.options.classes);
verify(getClass("test.AddClasses") != null, "Class found");
verify(typeof(Packages.test.AddClasses) == "function", "typeof(Packages.test.AddClasses) == function");
verify(new Packages.test.AddClasses().toString() == "Loaded");
if (pass) {
	jsh.shell.exit(0);
} else {
	debugger;
	jsh.shell.exit(1);
}