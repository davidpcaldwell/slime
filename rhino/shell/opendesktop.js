//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.shell.opendesktop.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.shell.opendesktop.Exports> } $export
	 */
	function($api,$context,$export) {
		//	See http://standards.freedesktop.org/desktop-entry-spec/1.0/
		/** @type { slime.jrunscript.shell.opendesktop.Exports["Entry"] } */
		var Entry = function(p) {
			var lines = [];

			if (typeof(p) == "string") {
				lines.push.apply(lines,p.split("\n"));
			} else if (p.Type && p.Name && p.Exec) {
				lines.push("[Desktop Entry]");

				for (var x in p) {
					lines.push(x + "=" + p[x]);
				}
			} else {
				throw new Error("Unsupported format: " + p);
			}

			this.toString = function() {
				return lines.join("\n");
			}

			this.get = function(name) {
				var group;
				for (var i=0; i<lines.length; i++) {
					var match;
					if (lines[i] == "" || /^\#/.test(lines[i])) {
					} else if (match = /^\[(.*)\]/.exec(lines[i])) {
						group = match[1];
					} else if (match = /^(.*)\=(.*)$/.exec(lines[i])) {
						if (group == "Desktop Entry" && match[1] == name) {
							return match[2];
						}
					}
				}
				return null;
			};

			this.set = function(name,value) {
				var group;
				for (var i=0; i<lines.length; i++) {
					var match;
					if (lines[i] == "" || /^\#/.test(lines[i])) {
					} else if (match = /^\[(.*)\]/.exec(lines[i])) {
						group = match[1];
						if (group != "Desktop Entry") {
							lines.splice(i,0,name + "=" + value);
							return;
						}
					} else if (match = /^(.*)\=(.*)$/.exec(lines[i])) {
						if (group == "Desktop Entry" && match[1] == name) {
							lines[i] = name + "=" + value;
							return;
						}
					}
				}
			}
		}

		var copy = function(fromdir,topathname) {
			fromdir.copy(
				topathname,
				{
					filter: function(p) {
						if (p.entry.node.pathname.basename == ".hg") return false;
						return true;
					}
				}
			);
			return topathname.directory;
		};

		var install = function(p) {
			var to = p.to.createDirectory({
				exists: function(dir) {
					dir.remove();
					return true;
				}
			});
			var destination = {
				src: to.getRelativePath("src"),
				script: to.getRelativePath("bin/script"),
				launcher: to.getRelativePath("bin/launcher.desktop")
			};
			if (p.src) {
				if (p.link && $context.library.shell.PATH.getCommand("ln")) {
					$context.library.shell.run({
						command: "ln",
						arguments: ["-s", p.src, destination.src]
					});
				} else {
					//	TODO	warn if problem was no ln in PATH
					copy(p.src,destination.src);
				}
			}
			//jsh.shell.echo("Writing opendesktop to " + p.opendesktop.entry);
			var script;
			if (p.code.executable) {
				script = p.code.executable;
			} else {
				throw new Error("Unimplemented.");
				//destination.script.write(p.code.bash, { append: false, recursive: true });
			}
			var desktop = new Entry(
				$context.library.js.Object.set(
					{
						Type: "Application",
						Name: p.name,
						Exec: ["/bin/bash", script].join(" ")
					},
					(p.opendesktop.GenericName) ? { GenericName: p.opendesktop.GenericName } : {},
					(p.opendesktop.Categories && p.opendesktop.Categories.length) ? { Categories: p.opendesktop.Categories.join(";") } : {}
				)
			);
			//	TODO	Icon
			if (p.icon) {
				throw new Error();
				//desktop.set("Icon", "something");
			}
			var launcher = (p.launcher) ? p.launcher : destination.launcher;
			launcher.write(desktop.toString(), { append: false, recursive: true });
			$context.library.shell.run({
				command: "chmod",
				arguments: ["+x", launcher]
			});
		};

		$export({
			Entry: Entry,
			install: install
		});
	}
//@ts-ignore
)($api,$context,$export);
