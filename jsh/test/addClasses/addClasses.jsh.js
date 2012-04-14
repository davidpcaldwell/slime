//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
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
		return $host.loadClass(name);
	} catch (e) {
		return null;
	}
}

//	The below line causes the caching behavior of AddClasses to kick in, which makes the final verification (after adding the class)
//	to fail, at least under Rhino 1.7R2
//verify(typeof(Packages.test.AddClasses) == "object", "typeof(Packages.test.AddClasses) == object");
verify(getClass("test.AddClasses") == null, "Class not found");
jsh.loader.addClasses(parameters.options.classes);
verify(getClass("test.AddClasses") != null, "Class found");
verify(typeof(Packages.test.AddClasses) == "function", "typeof(Packages.test.AddClasses) == function");
verify(new Packages.test.AddClasses().toString() == "Loaded");
if (pass) {
	jsh.shell.exit(0);
} else {
	debugger;
	jsh.shell.exit(1);
}