//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

jsh.loader.plugins(jsh.script.file.getRelativePath("../../rhino/tools/hg"));

if (jsh.script.arguments.length == 0) {
	var hgrc = jsh.script.file.getRelativePath("../../.hg/hgrc");
	if (!hgrc.file) {
		jsh.shell.echo("Not found: " + hgrc);
		jsh.shell.exit(1);
	}
	var Hgrc = function(file) {
		var headerMatch = /^\[(.*)\]/;
		var valueMatch = /^(\S+)(?:\s*)\=(?:\s*)(.+)$/
		var continueMatch = /^(\s+)(.*)$/
		var lines = file.read(String).split("\n");
		var sections = {};
		lines.forEach(function(line) {
			//Each line contains one entry. If the lines that follow are indented, they are treated as continuations of that entry.
			//Leading whitespace is removed from values. Empty lines are skipped. Lines beginning with # or ; are ignored and may be used to
			//provide comments
			if (!line) {
			} else if (line.substring(0,1) == "#" || line.substring(0,1) == ";") {
			} else if (headerMatch.test(line)) {
				var match = headerMatch.exec(line);
				if (!sections[match[1]]) {
					sections[match[1]] = [];
				}
				section = sections[match[1]];
			} else if (valueMatch.test(line)) {
				var match = valueMatch.exec(line);
				section.push({
					name: match[1],
					value: match[2]
				});
			} else if (continueMatch.test(line)) {
				throw new Error("Unimplemented: line continuation.");
			} else if (!line) {
			} else {
				jsh.shell.echo("No match: " + line);
			}
		});

		this.set = function(section,name,value) {
			if (!sections[section]) {
				sections[section] = [];
			}
			sections[section].push({ name: name, value: value });
		}

		this.write = function() {
			var lines = [];
			for (var x in sections) {
				if (lines.length != 0) {
					lines.push("");
				}
				lines.push("[" + x + "]");
				lines = lines.concat(sections[x].map(function(entry) {
					return entry.name + " = " + entry.value;
				}));
			}
			return lines.join("\n");
		}
	};
	var settings = new Hgrc(hgrc.file);
	var runscript = (function() {
		if (jsh.shell.rhino) {
			return [
				jsh.shell.java.home.getRelativePath("bin/java"),
				"-jar", jsh.shell.rhino.classpath,
				"-opt", "-1"
			];
		} else {
			var jrunscript = (function() {
				var rv = jsh.shell.java.home.getRelativePath("bin/jrunscript").file;
				if (!rv) rv = jsh.shell.java.home.getRelativePath("../bin/jrunscript").file;
				return rv;
			})();
			return [
				jrunscript.pathname
			]
		}
	})();
	//	TODO	adds hook even if it is already there
	settings.set("hooks","precommit.slime",runscript.concat([
//		jsh.script.file.parent.parent.parent.getFile("jsh/etc/develop.jsh.js"),
		"jsh/etc/unbuilt.rhino.js",
		"launch",
		"jsh/etc/develop.jsh.js",
		"commit"
	]).join(" "));
	jsh.shell.echo(settings.write());
	hgrc.write(settings.write(), { append: false });
} else if (jsh.script.arguments.length == 1 && jsh.script.arguments[0] == "commit") {
	var code = jsh.script.loader.module("code/module.js");
	var failed = false;
	code.files.trailingWhitespace({
		base: jsh.script.file.parent.parent.parent,
		isText: function(entry) {
			if (/\.def$/.test(entry.path)) {
				return true;
			}
			return code.files.isText(entry.node);
		},
		on: {
			unknownFileType: function(entry) {
				throw new Error("Unknown file type: " + entry.node);
			},
			change: function(p) {
				jsh.shell.echo("Changed " + p.path + " at line " + p.line.number);
			},
			changed: function(entry) {
				jsh.shell.echo("Modified: " + entry.node);
				failed = true;
			},
			unchanged: function(entry) {
				//jsh.shell.echo("No change: " + entry.node);
			}
		}
	});
	var licenseBase = jsh.script.file.getRelativePath("code").directory;
	var licenses = new jsh.document.Document({ string: licenseBase.getFile("licenses.xml").read(String) });
	jsh.script.loader.run("code/license.jsh.js", {
		parameters: {
			options: {
				base: jsh.script.file.parent.parent.parent.pathname
			}
		},
		$loader: new jsh.file.Loader({ directory: licenseBase }),
		getLicense: function(name) {
			var child = licenses.document.getElement().child(jsh.js.document.filter({ elements: name }));
			var text = child.children[0].getString();
			return text.substring(1,text.length-1);
		},
		fail: function() {
			failed = true;
		}
	});
	//jsh.shell.echo("Failed: " + failed);
	if (failed) {
		jsh.shell.exit(1);
	}
}