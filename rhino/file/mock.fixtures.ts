//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.mock {
	export namespace fixtures {
		export interface BinaryFile {
			bytes: number[]
		}

		export interface TextFile {
			text: string
		}

		export type File = BinaryFile | TextFile

		export type Node = File | Folder;

		export interface Folder {
			contents: { [name: string]: Node }
		}
	}

	export interface Fixtures {
		Filesystem: {
			from: {
				descriptor: (p: fixtures.Folder) => slime.jrunscript.file.world.Filesystem
			}
		}
	}

	(
		function($api: slime.$api.Global, $context: internal.mock.Context, $loader: slime.Loader, $export: slime.loader.Export<Fixtures>) {
			var script: internal.mock.Script = $loader.script("mock.js");

			var subject = script($context);

			const isTextFile = (p: fixtures.Node): p is fixtures.TextFile => typeof(p["text"]) == "string";
			const isBinaryFile = (p: fixtures.Node): p is fixtures.BinaryFile => Boolean(p["binary"]);

			var writeContents = function recurse(mock: slime.jrunscript.file.world.Filesystem, prefix: string, contents: slime.jrunscript.file.internal.test.filesystem.Folder["contents"]) {
				Object.entries(contents).forEach(function(entry) {
					var name = entry[0];
					var value = entry[1];
					if (isTextFile(value)) {
						var parent = (prefix + name).split("/").slice(0,-1).join("/");
						var parentExists = $api.fp.world.now.ask(mock.directoryExists({ pathname: parent }));
						if (!parentExists.present) throw new Error("Unreachable");
						if (!parentExists.value) {
							$api.fp.world.now.ask(mock.createDirectory({ pathname: parent }));
						}
						var o = $api.fp.world.now.question(
							mock.openOutputStream,
							{ pathname: prefix + mock.separator.pathname + name }
						);
						if (!o.present) throw new Error("Unreachable");
						o.value.character().write(value.text);
						o.value.close();
					} else if (isBinaryFile(value)) {
						// write it out
						throw new Error("Unimplemented: binary file.");
					} else {
						$api.fp.world.Means.now({
							means: mock.createDirectory,
							order: { pathname: prefix + mock.separator.pathname + name }
						})
						recurse(mock, prefix + mock.separator.pathname + name, value.contents);
					}
				})

			}

			var Filesystem: Fixtures["Filesystem"] = {
				from: {
					descriptor: function(p) {
						var mock = subject.filesystem();
						writeContents(mock, "", p.contents);
						return mock;
					}
				}
			}

			$export({
				Filesystem: Filesystem
			})
		}
	//@ts-ignore
	)($api,$context,$loader,$export);
}
