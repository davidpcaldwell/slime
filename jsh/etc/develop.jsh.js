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
	var settings = new hg.Hgrc({ file: hgrc.file });
	var runscript = (function() {
		if (jsh.shell.jsh.home) {
			return [
				jsh.shell.java.launcher,
				"-jar", jsh.shell.jsh.home.getRelativePath("jsh.jar")
			]
		} else if (jsh.shell.rhino) {
			return [
				jsh.shell.java.launcher,
				"-jar", jsh.shell.rhino.classpath,
				"-opt", "-1",
				"jsh/etc/unbuilt.rhino.js",
				"launch"
			];
		} else {
			var jrunscript = (function() {
				var rv = jsh.shell.java.home.getRelativePath("bin/jrunscript").file;
				if (!rv) rv = jsh.shell.java.home.getRelativePath("../bin/jrunscript").file;
				return rv;
			})();
			return [
				jrunscript.pathname,
				"jsh/etc/unbuilt.rhino.js",
				"launch"
			]
		}
	})();
	settings.set("hooks","precommit.slime",runscript.concat([
		"jsh/etc/develop.jsh.js",
		"commit"
	]).join(" "));
	settings.normalize();
	settings.write();
} else if (jsh.script.arguments.length == 1 && jsh.script.arguments[0] == "commit") {
	var code = jsh.script.loader.module("code/module.js");
	var failed = false;
	code.files.trailingWhitespace({
		base: jsh.script.file.parent.parent.parent,
		isText: function(entry) {
			if (/\.def$/.test(entry.path)) {
				return true;
			}
			if (entry.path == ".hgsub") return true;
			if (entry.path == ".hgsubstate") return false;
			return code.files.isText(entry.node);
		},
		on: {
			unknownFileType: function(entry) {
				throw new Error("Unknown file type; cannot determine whether text: " + entry.node);
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
	var javaFiles = jsh.script.file.parent.parent.parent.list({
		filter: function(node) {
			if (node.directory) return false;
			if (/\.java$/.test(node.pathname.basename)) return true;
			return false;
		},
		descendants: function(directory) {
			if (directory.pathname.basename == ".hg") return false;
			return true;
		}
	});
	javaFiles.forEach(function(item) {
		var changed = false;
		var code = item.read(String);
		while (/\@Override\n\s*/.test(code)) {
			changed = true;
			failed = true;
			code = code.replace(/@Override\n\s*/, "@Override ");
		}
		if (changed) {
			jsh.shell.echo("Reformatted Java: " + item);
			item.pathname.write(code, { append: false });
		}
	});
	//jsh.shell.echo("Failed: " + failed);
	if (failed) {
		jsh.shell.exit(1);
	}
}