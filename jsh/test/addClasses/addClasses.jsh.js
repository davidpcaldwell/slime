//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2011-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		classes: jsh.file.Pathname
	}
});

if (!parameters.options.classes) {
	var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
	parameters.options.classes = tmp.pathname;
	jsh.java.tools.javac({
		destination: parameters.options.classes,
		arguments: [jsh.script.file.getRelativePath("java/test/AddClasses.java")]
	});
}

jsh.shell.echo("Rhino: " + jsh.shell.rhino.classpath);
jsh.shell.echo("Classes: " + parameters.options.classes);

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
	return jsh.java.getClass(name);
}

var global = (function() { return this; })();

//	The below line causes the caching behavior of Packages to kick in, which makes the final verification (after adding the class)
//	to fail, at least under Rhino 1.7R2
verify(typeof(Packages.test.AddClasses) == "object", "typeof(Packages.test.AddClasses) == object");
verify(getClass("test.AddClasses") == null, "Class not found");
<<<<<<< local
//jsh.shell.echo("Classpath: " + jsh.loader.java);
jsh.loader.java.add(parameters.options.classes);
//jsh.shell.echo("Classpath: " + jsh.loader.java);
jsh.shell.echo("Classes added: " + parameters.options.classes);
=======
jsh.loader.addClasses(parameters.options.classes);
verify(jsh.$jsapi.$rhino.classpath.getClass("test.AddClasses") != null, "Class found through loader");
>>>>>>> other
verify(getClass("test.AddClasses") != null, "Class found");
verify(typeof(Packages.test.AddClasses) == "function", "typeof(Packages.test.AddClasses) == function");
verify(new Packages.test.AddClasses().toString() == "Loaded");
if (pass) {
	jsh.shell.exit(0);
} else {
	debugger;
	jsh.shell.exit(1);
}