//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	this is now run via jsh.loader.run, from develop.jsh.js, which is sloppy but was an easy way to wrap a jsh script

//var parameters = jsh.script.getopts({
//	options: {
//		base: jsh.file.Pathname,
//		year: false,
//		debug: false
//	}
//});

var year = new Date().getFullYear();
if (parameters.options.year && typeof(eval("hg")) == "undefined") {
	jsh.shell.echo("Required for -year: hg plugin");
	jsh.shell.exit(1);
} else if (parameters.options.year && !jsh.time) {
	jsh.shell.echo("Required for -year: time plugin");
	jsh.shell.exit(1);
} else if (parameters.options.year) {
	var repository = new hg.Repository(parameters.options.base.directory);
}

var BASE = parameters.options.base.directory;

//XML.ignoreWhitespace = false;
//XML.prettyPrinting = false;

var licenses = $loader.file("license.js", {
	getLicense: function(name) {
		return getLicense(name);
	}
});

//jsh.shell.echo(BASE);
//	TODO	could use sdk/core here
var files = BASE.list({
	filter: function(n) {
		return (!n.directory && n.pathname.basename.substring(0,3) != ".hg");
	},
	directory: function(dir) {
		return dir.pathname.basename != "local" && dir.pathname.basename != ".hg";
	},
	type: BASE.list.ENTRY
}).filter( function(n) { return !n.node.directory } )
.filter(function(n) {
	//	Test data files do not need a license
	return !/\.txt$/.test(n.node.pathname.basename)
});
//jsh.shell.echo(files);
var extensions = {};

var getExtension = function(file) {
	var tokens = file.node.pathname.basename.split(".");
	return tokens[tokens.length-1];
}

for (var i=0; i<files.length; i++) {
	var extension = getExtension(files[i]);
	//jsh.shell.echo(extension);
	if (!extensions[extension]) {
		extensions[extension] = [];
	}
	extensions[extension].push(files[i].node.pathname.toString());
}
//for (var x in extensions) {
//	jsh.shell.echo(x + ": " + extensions[x]);
//	jsh.shell.echo("");
//}

var template = licenses.mpl["2.0"];

//jsh.shell.echo(template.original.parser.toString());
//jsh.shell.echo(template.introduction.parser.toString());
//jsh.shell.echo(template.introduction.create());

var repository = new hg.Repository({ local: BASE });
var username = repository.shell({
	command: "showconfig",
	arguments: ["ui.username"],
	evaluate: function(result) {
		if (result.status == 0) {
			return /^(?:\s*)(.*?)(?:\s*)$/.exec(result.stdio.output)[1];
		} else {
			throw new TypeError();
		}
	}
});
//jsh.shell.echo("username = [" + username + "]");

for (var i=0; i<files.length; i++) {
	var file = files[i];
	var extension = getExtension(file);
	var text = file.node.read(String);
	text = text.replace(/\r\n/g, "\n");
	if (!licenses.languages[extension]) throw new Error("Not found: " + extension);
	var source = new licenses.SourceFile(text.split("\n"), licenses.languages[extension], template);
	if (source.license) {
		var UPGRADE_LICENSE = false;
		if (parameters.options.year) {
			var log = repository.log(file.path);
			jsh.shell.echo();
			jsh.shell.echo(file.path + ": " + jsh.js.toLiteral(log));
			var initialYear = log[log.length-1].date.getFullYear();
			source.license = jsh.js.Object.set({}, source.license, {
				copyright: {
					initial: source.license.copyright.initial,
					year: (initialYear == year) ? String(year) : String(initialYear) + "-" + String(year)
				}
			});
			debugger;
		} else if (UPGRADE_LICENSE) {
			source.license = source.license;
		}
		//jsh.shell.echo("file = " + file.node + " license = " + jsh.js.toLiteral(source.license));
	} else {
		var relative = file.node.pathname.toString().substring(BASE.toString().length);

		var startsWith = function(prefix) {
			return function(string) {
				if (string.substring(0,"slime/".length) == "slime/") {
					throw new Error("Invoked on directory above slime/");
				}
				return string.substring(0,prefix.length) == prefix;
			}
		}

		var copyright = {
			initial: username,
			year: String(year)
		};
		var original = null;
		if (startsWith("js/object/")(relative)) {
			original = "the js/object SLIME module";
		} else if (startsWith("js/debug/")(relative)) {
			original = "the js/debug SLIME module";
		} else if (startsWith("js/promise/")(relative)) {
			original = "the js/promise SLIME module";
		} else if (startsWith("js/time/")(relative)) {
			original = "the js/time SLIME module";
		} else if (startsWith("js/web/")(relative)) {
			original = "the js/web SLIME module";
		} else if (startsWith("loader/rhino/")(relative)) {
			original = "the SLIME loader for rhino";
		} else if (startsWith("loader/browser/")(relative)) {
			original = "the SLIME loader for web browsers";
		} else if (startsWith("loader/")(relative)) {
			original = "the SLIME loader infrastructure";
		} else if (startsWith("rhino/io/")(relative)) {
			original = "the rhino/io SLIME module";
		} else if (startsWith("rhino/document/")(relative)) {
			original = "the SLIME Java Document API";
		} else if (startsWith("rhino/mail/")(relative)) {
			original = "the SLIME JavaMail interface";
		} else if (startsWith("rhino/file/")(relative)) {
			original = "the rhino/file SLIME module";
		} else if (startsWith("rhino/host/")(relative)) {
			original = "the rhino/host SLIME module";
		} else if (startsWith("rhino/ip/")(relative)) {
			original = "the rhino/ip SLIME module";
		} else if (startsWith("rhino/shell/")(relative)) {
			original = "the rhino/shell SLIME module";
		} else if (startsWith("rhino/system/")(relative)) {
			original = "the SLIME operating system interface";
		} else if (startsWith("rhino/ui/")(relative)) {
			original = "the SLIME Java GUI module";
		} else if (startsWith("jsh/")(relative)) {
			original = "the jsh JavaScript/Java shell";
		} else if (startsWith("rhino/http/client/")(relative)) {
			original = "the rhino/http/client SLIME module";
		} else if (startsWith("rhino/http/servlet/")(relative)) {
			original = "the SLIME servlet interface";
		} else if (startsWith("rhino/tools/")(relative)) {
			original = "the SLIME JDK interface";
		} else if (startsWith("rhino/jrunscript/")(relative)) {
			original = "the InOnIt jrunscript API";
		} else if (relative == "api.html" || relative == "internal.api.html") {
			original = "the SLIME project";
		} else {
			throw new Error("Unimplemented: " + relative);
		}
		source.license = {
			original: (original) ? original : "(unspecified)",
			copyright: copyright
		};
	}
	if (parameters.options.debug) {
		debugger;
		jsh.shell.echo("Would write to " + file.node.pathname);
		jsh.shell.echo(source.toString());
	} else {
		file.node.pathname.write(source.toString(), { append: false });
	}
}