//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		//	TODO	obsolete; harvest anything useful and remove. See contributor/hooks
		jsh.loader.plugins(jsh.script.file.parent.getRelativePath("../rhino/tools/hg"));

		if (jsh.script.arguments.length == 0) {
			var hgrc = jsh.script.file.parent.getRelativePath("../.hg/hgrc");
			if (!hgrc.file) {
				jsh.shell.echo("Not found: " + hgrc);
				jsh.shell.exit(1);
			}
			var settings = new jsh.tools.hg.Hgrc({ file: hgrc.file });
			var runscript = (function() {
				if (jsh.shell.jsh.home) {
					return [
						jsh.shell.java.jrunscript,
						jsh.shell.jsh.home.getRelativePath("jsh.js")
					]
				} else if (jsh.shell.rhino) {
					return [
						jsh.shell.java.jrunscript,
						"-Djsh.engine.rhino.classpath=" + jsh.shell.rhino.classpath,
						"rhino/jrunscript/api.js",
						"jsh/launcher/main.js"
					];
				} else {
					return [
						jsh.shell.java.jrunscript,
						"rhino/jrunscript/api.js",
						"jsh/launcher/main.js"
					];
				}
			})();
			settings.set("hooks","precommit.slime",runscript.concat([
				"contributor/develop.jsh.js",
				"commit"
			]).join(" "));
			settings.normalize();
			settings.write();
		} else if (jsh.script.arguments.length == 1 && jsh.script.arguments[0] == "commit") {
			var loader = new jsh.file.Loader({ directory: jsh.script.file.parent });
			/** @type { slime.project.code.Script } */
			var script = loader.script("code/module.js");
			var code = script({
				console: jsh.shell.console,
				library: {
					file: jsh.file
				}
			});
			var failed = false;
			code.files.trailingWhitespace({
				base: jsh.script.file.parent.parent,
				isText: function(entry) {
					if (/\.def$/.test(entry.path)) {
						return true;
					}
					if (entry.path == ".hgsub") return true;
					if (entry.path == ".hgsubstate") return false;
					if (entry.path == ".hgignore") return false;
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
			var licenseBase = jsh.script.file.parent.getRelativePath("code").directory;
			var licenses = new jsh.document.Document({ string: licenseBase.getFile("licenses.xml").read(String) });
			jsh.script.loader.run("code/license.jsh.js", {
				parameters: {
					options: {
						base: jsh.script.file.parent.parent.pathname
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
	}
//@ts-ignore
)(jsh);
