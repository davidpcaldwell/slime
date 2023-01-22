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
		//	TODO	this file is obsolete. Duplicative code was eliminated; what remains below could be harvested
		if (false) {
		} else if (jsh.script.arguments.length == 1 && jsh.script.arguments[0] == "commit") {
			var failed = false;
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
