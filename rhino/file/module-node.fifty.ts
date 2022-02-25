//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Node {
		/**
		 * Moves (or renames) this node to a different location.
		 *
		 * @param to The location to which to move this node; if it is a directory, the node will be moved into that directory
		 * with its current basename; if it is a pathname, the node will be moved to that pathname.
		 *
		 * @param mode A mode argument that configures the operation of this method.
		 *
		 * @returns The node at the new location.
		 */
		move: (
			to: Pathname | Directory,
			mode: {
				/**
				 * Whether to overwrite an existing node at the destination location if one is found.
				 */
				overwrite: boolean

				//	TODO	specify default
				/**
				 * Whether to create the necessary parent directories if the parent directories of the destination location do not
				 * exist.
				 */
				recursive?: boolean
			}
		) => Node
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { verify } = fifty;

			const fixtures = (function() {
				var script: test.fixtures.Script = fifty.$loader.script("fixtures.ts");
				return script({ fifty: fifty });
			})();

			const test = function(b: boolean) {
				verify(b).is(true);
			}

			const expectError = function(test, execute, error = true) {
				var failed;
				try {
					execute();
					failed = false;
				} catch (e) {
					failed = true;
				}
				test(failed == error);
			}

			fifty.tests.suite = function() {
				var top = fixtures.newTemporaryDirectory();

				var d1 = top.getRelativePath("d1").createDirectory();
				var d2 = top.getRelativePath("d2").createDirectory();
				d2.getRelativePath("f").write("d2/f", { append: false });

				top.getRelativePath("f1").write("f1", { append: false });
				var f1 = top.getFile("f1");
				top.getRelativePath("f2").write("f2", { append: false });
				var f2 = top.getFile("f2");
				var p1 = top.getRelativePath("p1");
				var p2 = top.getRelativePath("p2");
				var p3 = top.getRelativePath("p3/sub");
				var p4 = top.getRelativePath("p4/file");

				test(p1.directory == null);
				var d1_moved = d1.move(p1);
				//	TODO	what is state of d1 object now?
				test(p1.directory != null);
				test(d1_moved.pathname.toString() == p1.directory.pathname.toString());

				test(p2.file == null);
				f1.move(p2);
				//	TODO	what is state of f1 object now?
				test(p2.file != null);
				test(p2.file.read(String) == "f1");

				//	Test overwrite property
				expectError(test, function() {
					d2.move(p1);
				});
				test(p1.directory != null);
				test(p1.directory.getFile("f") == null);

				d2.move(p1, { overwrite: true });
				test(p1.directory != null);
				test(p1.directory.getFile("f") != null);

				test(p2.file != null);
				expectError(test, function() {
					f2.move(p2);
				});
				test(p2.file.read(String) == "f1");

				test(p2.file != null);
				expectError(test, function() {
					f2.move(p2, { overwrite: true });
				}, false);
				test(p2.file.read(String) == "f2");

				//	Test recursive property
				expectError(test, function() {
					p1.directory.move(p3);
				});
				test(p3.directory == null);
				p1.directory.move(p3, { recursive: true });
				test(p3.directory != null);

				expectError(test, function() {
					p2.file.move(p4);
				});
				test(p4.file == null);
				p2.file.move(p4, { recursive: true });
				test(p4.file != null);
				test(p4.file.read(String) == "f2");

				top.getRelativePath("f3").write("f3", { append: false });
				var d3 = top.getRelativePath("d3").createDirectory();
				test(top.getFile("f3") != null);
				test(d3.getFile("f3") == null);
				var f3 = top.getFile("f3");
				f3.move(d3);
				test(top.getFile("f3") == null);
				test(d3.getFile("f3") != null);
			}
		}
	//@ts-ignore
	)(fifty);

}
