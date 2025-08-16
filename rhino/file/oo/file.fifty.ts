//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	/**
	 * An object representing a path in the local file system.
	 */
	export interface Pathname {
		//	TODO	type of the exists callback is probably wrong, probably should be Node since it could be a file, according to
		//			the documentation

		/**
		 * Creates a directory at the location of this `Pathname` and returns it.
		 *
		 * By default, this method throws an exception if the directory cannot be created or if it already exists. This behavior can
		 * be overridden using the argument.
		 *
		 * @param p An object representing a mode of operation for this method.
		 *
		 * @returns The directory that was created (or already existed; see the `exists()` method of the argument).
		 */
		createDirectory: (p?: {
			/**
			 * A method that will be invoked if a file or directory at this pathname already exists.
			 *
			 * The default implementation throws an exception, but callers can override this behavior. For example, to simply ensure
			 * that a directory exists, one can call `createDirectory()` and use an `exists` function that does nothing and returns
			 * `false` (the `Pathname.createDirectory.exists.LEAVE` function is provided as a convenience). Then, if the directory
			 * exists, `createDirectory()` will abort early. To create a "working" directory that is empty (deleting it if it
			 * already exists), use an `exists` method that removes the directory and then returns `true` (the
			 * `Pathname.createDirectory.exists.RECREATE` function is provided as a convenience for this).
			 *
			 * @param d The node that exists at the given pathname.
			 *
			 * @returns Whether to continue normal processing after `exists` is invoked.
			 */
			exists?: (d: Directory) => boolean

			/**
			 * A `boolean` representing whether this method should recursively create any parent directories of this `Pathname` if
			 * necessary.
			 */
			recursive?: boolean

			/** @deprecated Use `exists`. */
			ifExists?: (d: Directory) => boolean
		}) => Directory
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;
			const { verify } = fifty;

			var script: internal.test.fixtures.Script = fifty.$loader.script("../fixtures.ts");
			var fixtures = script({ fifty: fifty, prefix: "../" });

			const { module, newTemporaryDirectory, createFile } = fixtures;

			fifty.tests.createDirectory = function() {
				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var at = tmp.getRelativePath("doesNotExist");
				var existing = newTemporaryDirectory().pathname;
				createFile(existing.directory,"file",10);
				var replace = newTemporaryDirectory().pathname;
				createFile(replace.directory,"file",10);
				verify(module).is.type("object");
				verify(at).directory.is.type("null");
				at.createDirectory();
				verify(at).directory.is.type("object");
				existing.createDirectory({ exists: module.Pathname.createDirectory.exists.LEAVE });
				verify(existing).directory.getFile("file").is.type("object");
				replace.createDirectory({ exists: module.Pathname.createDirectory.exists.RECREATE });
				verify(replace).directory.getFile("file").is.type("null");
			}
		}
	//@ts-ignore
	)(fifty);


	export interface Pathname {
		/**
		 * The name of this file, excluding any path information; for example, `"ls"` if this Pathname represents `/bin/ls`.
		 */
		readonly basename: string

		/**
		 * A `Pathname` representing the path of the parent directory of this `Pathname`, or `null` if this Pathname is at the top
		 * of the hierarchy.
		 */
		readonly parent: Pathname

		/**
		 * Opens a file located at the location of this `Pathname` for writing, possibly writing data to it.
		 */
		write: slime.jrunscript.runtime.old.Resource["write"]

		/**
		 * An object representing the file located at the location of this `Pathname`, or `null` if a (non-directory) file with
		 * this `Pathname` does not exist.
		 */
		readonly file: File

		/**
		 * (Read-only) An object representing the directory located at the location of this `Pathname`, or `null` if a directory
		 * with this `Pathname` does not exist.
		 */
		readonly directory: Directory

		os: {
			adapt: () => slime.jrunscript.file.Location
		}

		java: {
			adapt: () => slime.jrunscript.native.java.io.File
		}

		/**
		 * Converts the path to a string and returns it.
		 */
		toString: () => string
	}

	export namespace pathname {
		export interface WriteMode {
			append?: boolean
			recursive?: boolean

			/** @deprecated Replaced by `append` (with opposite semantics). */
			overwrite?: boolean
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.Node = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Node {
		/**
		 * The directory containing this node.
		 */
		parent: Directory
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.Node.parent = function() {
				var file = fifty.jsh.file.object.getRelativePath("file.fifty.ts").file;
				var parent = file.parent;
				verify(parent,"parent").getFile("file.fifty.ts").evaluate(String).is(file.toString());
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Node {
		//	TODO	should we be preserving attributes like timestamps?
		//	TODO	does this preserve modification times?
		//	Inspiration: https://linux.die.net/man/1/cp
		/**
		 * Copies this node to another location. If this node is a regular file, the file is copied. If this node is a directory,
		 * the node is copied recursively. Directories can be selectively copied using the `filter` property of the second argument.
		 *
		 * @param pathname A location to which to copy this node. If the given argument is a `Directory`, the node will be copied
		 * into that directory with this node's basename. If the given argument is a `Pathname`, the node will be copied to the
		 * given `Pathname`.
		 *
		 * @param mode An object whose properties specify the operation of this method.
		 *
		 * @returns The node created by this copy.
		 */
		copy: ((
			pathname: Pathname | Directory,
			mode?: {
				//	TODO	this filtering approach should probably be harmonized with list() if it is not already
				/**
				 * A function that specifies which nodes to copy. For an ordinary file, this function will be invoked once with the
				 * given file; for a directory, it will be invoked for the directory and then recursively for its contents. If
				 * omitted, an implementation will be supplied that copies all nodes unless there is an existing node at the given
				 * location, in which case it will throw an exception.
				 *
				 * @param p An argument with properties describing a node to copy.
				 *
				 * @returns If `true` is returned, then if this node is an ordinary file, it will be copied, overwriting the file at
				 * the given location. If it is a directory, then the directory will be created; if it already exists, no action
				 * will be taken. If `false` is returned, then for ordinary files; no action will be taken. For directories, not
				 * only will no action be taken, but the contents of the given directory will not be processed.
				 */
				filter?: (p: {
					/**
					 * The entry to copy, relative to the node on which the `copy()` method was invoked.
					 */
					entry: NodeListEntry

					/**
					 * The node, if any, that already exists at the destination to which this node will be copied.
					 */
					exists: slime.jrunscript.file.Node
				}) => boolean

				/**
				 * If `true`, then if the parent directory or directories to which this file would be copied do not exist, they will
				 * be created. Otherwise, if they do not exist, an exception will be thrown.
				 */
				recursive?: any
			}
		) => this) & {
			/**
			 * An object whose properties supply implementations suitable for use as the `filter` property of the mode argument of
			 * `copy`.
			 */
			filter: {
				/**
				 * Implementation that always overwrites the given files and directories.
				 */
				OVERWRITE: Parameters<Node["copy"]>[1]["filter"]
			}
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var script: internal.test.fixtures.Script = fifty.$loader.script("../fixtures.ts");
			var fixtures = script({ fifty: fifty, prefix: "../" });

			const { newTemporaryDirectory, filesystem } = fixtures;

			var scope: {
				d1: slime.jrunscript.file.Directory
				f1: slime.jrunscript.file.File
				f2: slime.jrunscript.file.File
				d2: slime.jrunscript.file.Directory
				d3: slime.jrunscript.file.Directory
				d4: slime.jrunscript.file.Directory
				f3: slime.jrunscript.file.File
				d5: slime.jrunscript.file.Directory
				f4: slime.jrunscript.file.File
				p1: slime.jrunscript.file.Pathname
				p2: slime.jrunscript.file.Pathname
				p_overwrite: slime.jrunscript.file.Pathname
				p_recursive: slime.jrunscript.file.Pathname
				p_recursive2: slime.jrunscript.file.Pathname
				top: slime.jrunscript.file.Directory
			} = {
				d1: void(0),
				f1: void(0),
				f2: void(0),
				d2: void(0),
				d3: void(0),
				d4: void(0),
				f3: void(0),
				d5: void(0),
				f4: void(0),
				p1: void(0),
				p2: void(0),
				p_overwrite: void(0),
				p_recursive: void(0),
				p_recursive2: void(0),
				top: void(0)
			};

			(
				function() {
					var top = newTemporaryDirectory();
					scope.d1 = top.getRelativePath("d1").createDirectory();
					top.getRelativePath("f1").write("f1", { append: false });
					top.getRelativePath("f2").write("f2", { append: false });
					scope.f1 = top.getFile("f1");
					scope.f2 = top.getFile("f2");
					scope.d2 = top.getRelativePath("d2").createDirectory();
					scope.d3 = top.getRelativePath("d3").createDirectory();
					scope.d4 = top.getRelativePath("d4").createDirectory();
					scope.d4.getRelativePath("f3").write("f3", { append: false });
					scope.f3 = scope.d4.getFile("f3");
					scope.d5 = scope.d4.getRelativePath("d5").createDirectory();
					scope.d5.getRelativePath("f4").write("f4", { append: false });
					scope.f4 = scope.d5.getFile("f4");
					scope.p1 = top.getRelativePath("p1");
					scope.p2 = top.getRelativePath("p2");
					scope.p_overwrite = top.getRelativePath("p_overwrite");
					scope.p_recursive = top.getRelativePath("p_recursive/sub");
					scope.p_recursive2 = top.getRelativePath("p_recursive2/sub");

					scope.top = top;
				}
			)();

			const test = function(b: boolean) {
				verify(b).is(true);
			}

			const expectError = function(test,f,expect?) {
				if (typeof(expect) == "undefined") {
					expect = true;
				}
				var invoke = function() {
					try {
						f();
						test(!expect);
					} catch (e) {
						test(expect);
					}
				};
				(function() {
					if (expect) {
						$api.debug.disableBreakOnExceptionsFor(invoke)();
					} else {
						invoke();
					}
				})();
			}

			const { d1, f1, f2, p1, d4, d2, p2, p_recursive, p_recursive2, top, p_overwrite } = scope;

			fifty.tests.Node.copy = fifty.test.Parent();

			fifty.tests.Node.copy._1 = function() {
				test(d1.getFile("f1") == null);
				f1.copy(d1);
				test(d1.getFile("f1") != null);

				expectError(test, function() {
					f1.copy(d2.pathname)
				});

				test(p1.file == null);
				f1.copy(p1);
				test(p1.file != null);

				test(d1.getSubdirectory("d4") == null);
				var d4_copy = d4.copy(d1);
				test(d1.getSubdirectory("d4") != null);
				test(d1.getFile("d4/f3") != null);
				test(d1.getFile("d4/f3").read(String) == "f3");
				test(d4_copy.getFile("f3") != null);
				test(d4_copy.getFile("f3").read(String) == "f3");
				test(d4_copy.getFile("d5/f4").read(String) == "f4");

				test(d2.getSubdirectory("d4") == null);
				var d4_copy2 = d4.copy(d2);
				test(d2.getSubdirectory("d4") != null);
				test(d2.getFile("d4/f3") != null);
				test(d2.getFile("d4/f3").read(String) == "f3");
				test(d4_copy2.getFile("f3") != null);
				test(d4_copy2.getFile("f3").read(String) == "f3");
				test(d4_copy2.getFile("d5/f4").read(String) == "f4");

				test(p2.directory == null);
				var d4_copy3 = d4.copy(p2);
				test(p2.directory != null);
				test(p2.directory.getFile("f3") != null);
				test(p2.directory.getFile("f3").read(String) == "f3");
				test(d4_copy3.getFile("f3") != null);
				test(d4_copy3.getFile("f3").read(String) == "f3");
				test(d4_copy3.getFile("d5/f4").read(String) == "f4");
			};

			fifty.tests.Node.copy._2 = function() {
				if (jsh.shell.PATH.getCommand("chmod")) {
					var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					tmpdir.getRelativePath("a").write("", { append: false });
					jsh.shell.run({
						command: "chmod",
						arguments: ["+x", tmpdir.getRelativePath("a")]
					});

					var _getPermissions = function(file) {
						var _nio = file.pathname.java.adapt().toPath();
						var _permissions = Packages.java.nio.file.Files.getPosixFilePermissions(_nio);
						return _permissions;
					};

					var _permissions = _getPermissions(tmpdir.getFile("a"));
					var permissionsString = String(_permissions);
					verify(permissionsString).is(permissionsString);

					const asBoolean = function(p: any) { return p as boolean; };
					verify(_permissions.contains(Packages.java.nio.file.attribute.PosixFilePermission.OWNER_EXECUTE)).evaluate(asBoolean).is(true);

					tmpdir.getFile("a").copy(tmpdir.getRelativePath("b"));
					var _p2 = _getPermissions(tmpdir.getFile("b"));
					verify(_p2.contains(Packages.java.nio.file.attribute.PosixFilePermission.OWNER_EXECUTE)).evaluate(asBoolean).is(true);
				}
			};

			fifty.tests.Node.copy._3 = function() {
				expectError(test,function() {
					f1.copy(p_recursive);
				},true);
				try {
					var copied = f1.copy(p_recursive, { recursive: true });
					test(true);
					test(p_recursive.file.read(String) == "f1");
					test(copied.read(String) == "f1");
				} catch (e) {
					test(false);
				}

				expectError(test, function() {
					d4.copy(p_recursive2);
				});
				expectError(test, function() {
					var to = d4.copy(p_recursive2, { recursive: true });
					test(p_recursive2.directory.getFile("f3").read(String) == "f3");
					test(to.getFile("f3").read(String) == "f3");
				}, false);
			};

			fifty.tests.Node.copy._4 = function() {
				var d_filter = top.getRelativePath("d_filter").createDirectory();
				d_filter.getRelativePath("a").write("a", { append: false });
				d_filter.getRelativePath("d/b").write("b", { append: false, recursive: true });
				var d_filter2 = top.getRelativePath("d_filter2").createDirectory();
				d_filter2.getRelativePath("a").write("a2", { append: false });
				var p_filter = top.getRelativePath("p_filter");
				var p_filter2 = top.getRelativePath("p_filter2");
				var p_filter3 = top.getRelativePath("p_filter3");
				var p_filter4 = top.getRelativePath("p_filter4");

				f1.copy(p_overwrite);
				expectError(test, function() {
					f2.copy(p_overwrite);
				});
				test(p_overwrite.file.read(String) == "f1");

				expectError(test, function() {
					var copied = f2.copy(p_overwrite, { filter: f2.copy.filter.OVERWRITE });
					test(p_overwrite.file.read(String) == "f2");
					test(copied.read(String) == "f2");
				}, false);

				//	Implement for directories
				//	TODO	definition should be consolidated with list() if possible
				var copied = d_filter.copy(p_filter);
				test(copied.getFile("a") != null);
				test(copied.getFile("a").read(String) == "a");
				test(copied.getFile("d/b") != null);
				test(copied.getFile("d/b").read(String) == "b");

				var filtered2 = d_filter.copy(p_filter2, {
					filter: function(p) {
						if (p.entry.path == "") return true;
						if (p.entry.path == ("d" + filesystem.$unit.getPathnameSeparator())) return true;
					}
				});
				test(filtered2.getFile("a") == null);
				test(filtered2.getSubdirectory("d") != null);
				test(filtered2.getFile("d/b") == null);

				var filtered3 = d_filter.copy(p_filter3, {
					filter: function(p) {
						if (p.entry.path == "") return true;
						if (p.entry.path == "a") return true;
					}
				});
				test(filtered3.getFile("a") != null);
				test(filtered3.getSubdirectory("d") == null);
				test(filtered3.getFile("d/b") == null);

				var filtered4 = d_filter.copy(p_filter4, {
					filter: function(p) {
						if (p.entry.path == "") return true;
						if (p.entry.path == "d/b") return true;
					}
				});
				test(filtered4.getFile("a") == null);
				test(filtered4.getSubdirectory("d") == null);
				test(filtered4.getFile("d/b") == null);

				var filtered5 = d_filter2.copy(p_filter, {
					filter: function(p) {
						if (p.entry.path == "") return true;
						if (p.exists) return false;
						return true;
					}
				});
				test(filtered5.getFile("a").read(String) == "a");

				var filtered6 = d_filter2.copy(p_filter, {
					filter: function(p) {
						return true;
					}
				});
				test(filtered6.getFile("a").read(String) == "a2");
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	/**
	 * An object representing a node in the local file system.
	 */
	export interface Node {
		/**
		 * The location of this file in the local file system.
		 */
		toString: Object["toString"]

		/**
		 * A Pathname corresponding to the location of this node.
		 */
		pathname: Pathname

		/**
		 * Whether this node represents a directory (`true`) or an ordinary file (`false`).
		 */
		directory: boolean

		/**
		 * Removes this node, recursively removing any children if it is a directory.
		 */
		remove: () => void

		/**
		 * The time at which this node was last modified.
		 */
		modified: Date
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.File = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	//	TODO	possibly this also extends the jrunscript resource type?

	export interface File extends Node {
		/**
		 * Opens this file for reading.
		 *
		 * @param p An argument specifying how the caller wants to read the file. The following arguments
		 * are allowed. If the argument is:
		 * * `Streams.binary`, `read` will return a `jrunscript/io` *binary input stream* which can be used to read the file.
		 * * `Streams.text`, `read` will return a `jrunscript/io` *character input stream* which can be used to read the file.
		 * * The global function `String`, `read` will read the entire file into a `string` and return it.
		 * * The global function `XML`, `read` will read the entire file into an `XMLList` and return it.
		 *
		 * @returns Either the content of the file or a stream for reading that content, depending on its arguments: see above.
		 */
		read: {
			(p: StringConstructor): string
			(p: any): any
		}

		/**
		 * The size of this file, in bytes.
		 */
		length: any
	}

	export interface File extends Node {
		type: slime.mime.Object
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.File._1 = function() {
				var apiHtml = fifty.jsh.file.object.getRelativePath("file.js").file;
				verify(apiHtml).type.evaluate(String).is("application/javascript");
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace directory {
		export namespace list {
			export interface Format<T> {
				filter?: (child: Node) => boolean
				create: (self: Directory, child: Node) => T
			}

			export interface Settings<T> {
				/**
				 * Specifies whether to return `Node` objects from this method, or to return
				 * objects describing the directory contents more fully.
				 */
				type?: Format<T>

				/**
				 * Used to filter the results of listing this directory. Nodes that the filter does not accept will not be
				 * returned (but if they are directories, their contents may still be returned; see `descendants`).
				 *
				 * If this property is a `function`, it will be invoked for each node found.
				 *
				 * If this property is a `RegExp`, the `basename` (see `Pathname`) of each node will be tested against the `RegExp`
				 * and only those that match will be returned; those that do not match will be excluded.
				 *
				 * @param node A node found when listing this directory.
				 *
				 * @returns `true` to include this node, `false` to exclude it.
				 */
				filter?: ( (node: Node) => boolean ) | RegExp

				/**
				 * Specifies whether to search descendant directories when listing this directory. If absent, subdirectories will
				 * not be searched.
				 *
				 * @returns `true` to indicate the contents of this directory should be processed; `false` to indicate the
				 * directory should not be processed.
				 */
				descendants?: (dir: Directory) => boolean

				/** @deprecated */
				recursive?: any
			}
		}
	}

	/**
	 * Consists of a {@link Node} and a path to it relative to a base directory. Used in directory operations that return or
	 * process a set of nodes.
	 */
	export interface NodeListEntry {
		/**
		 * The path, relative to the base, at which this node can be found. For the base directory itself, this will be a
		 * zero-length string.
		 */
		path: string
		node: slime.jrunscript.file.Node
	}

	export interface Exports {
		list: {
			/**
			 * Use {@link Node} objects when listing files.
			 */
			NODE: slime.jrunscript.file.directory.list.Format<slime.jrunscript.file.Node>

			/**
			 * Returns {@link Node}s, along with their relative paths, when listing files.
			 */
			ENTRY: slime.jrunscript.file.directory.list.Format<NodeListEntry>

			// TODO	add RESOURCE that returns an array of path/resource? easy descriptor, would
			// 		probably then exclude directories explicitly and this could be used as easy input
			// 		to lots of things logically representing trees.

			/**
			 * Returns only {@link File}s, along with their relative paths, when listing files.
			 */
			RESOURCE: slime.jrunscript.file.directory.list.Format<{
				/**
				 * The path, relative to this directory, at which this node can be found, delimited by forward slashes regardless
				 * of the underlying filesystem.
				 */
				path: string

				/**
				 * A resource, with the second argument to write having semantics of the second argument to `Pathname.write()`.
				 */
				resource: slime.jrunscript.file.File
			}>
		}
	}

	export interface Directory extends Node {
		/**
		 *
		 * @param path A relative path that will be interpreted relative to this directory's location.
		 */
		getRelativePath: (path: string) => Pathname

		/**
		 * @param path A filesystem path relative to this directory.
		 *
		 * @returns A file that can be found at the given location, or `null` if no (non-directory) file exists at that location.
		 */
		getFile: (path: string) => File

		/**
		 *
		 * @param path A relative path.
		 *
		 * @returns A subdirectory that can be found at the given location relative to this directory, or `null` if no directory
		 * exists at that location.
		 */
		getSubdirectory: (path: string) => Directory

		createTemporary: {
			(p: { directory: true, prefix?: string, suffix?: string }): Directory
			(p?: { directory?: false, prefix?: string, suffix?: string }): File
		}

		/**
		 * Lists the nodes (or a subset of those nodes) contained in this directory.
		 */
		list: {
			<T>(mode: directory.list.Settings<T>): T[]

			(mode: Pick<directory.list.Settings<Node>,"filter" | "descendants" | "recursive">): Node[]

			(): Node[]

			/** @deprecated Use {@link Exports | Exports.list.NODE } */
			NODE: Exports["list"]["NODE"]

			/** @deprecated Use {@link Exports | Exports.list.RESOURCE } */
			RESOURCE: Exports["list"]["RESOURCE"]

			/** @deprecated Use {@link Exports | Exports.list.ENTRY } */
			ENTRY: Exports["list"]["ENTRY"]
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			function ftest(b: () => boolean, name: string) {
				verify(b(),name).is(true);
			}

			function test(b: boolean) {
				verify(b).is(true);
			}

			var script: internal.test.fixtures.Script = fifty.$loader.script("../fixtures.ts");
			var fixtures = script({ fifty: fifty, prefix: "../" });

			const { context, module, newTemporaryDirectory, createFile, createDirectory, filesystem } = fixtures;

			const local = {
				fixtures: function(filesystem) {
					var dir = newTemporaryDirectory(filesystem);

					var filea = createFile(dir,"a");
					var fileb = createFile(dir,"b");
					var filec = createDirectory(dir,"c");
					var filed = createFile(filec,"d");
					var filee = createDirectory(dir,"e");
					var filef = createFile(filee,"f");

					createFile(dir,"target",1112);

					return {
						dir,
						filee
					}
				}
			};

			var { UNIX } = (
				function() {
					const UNIX = (filesystem.$unit.getPathnameSeparator() == "/");

	// 				var _scenario = new function() {
	// 					var tmpdir;
	// 					var UNIX;
	// 					var hostdir;

	// 					this.name = "Filesystem tests; filesystem = " + filesystem;

	// 					this.initialize = function() {
	// 						//if (!SCOPE.module) throw "Missing SCOPE.module: module=" + module;
	// 						if (SCOPE.module) {
	// 							SCOPE.module.filesystem = filesystem;
	// 						} else {
	// 							module.filesystem = filesystem;
	// 						}
	// 					}

	// 					this.execute = function(scope) {
	// 						scope.scenario( new function() {
	// 							this.name = "File tests";

	// 							this.initialize = function() {
	// 								var createDirectory = function(file) {
	// 									file.mkdir();
	// 									return file;
	// 								}

	// 								tmpdir = $jsapi.java.io.newTemporaryDirectory();

	// 								hostdir = new Packages.java.io.File(tmpdir, "filetests" );
	// 								hostdir.mkdirs();
	// 								createFile(new Packages.java.io.File(hostdir, "a"));
	// 								createFile(new Packages.java.io.File(hostdir, "b"));
	// 								var hostfilec = createDirectory(new Packages.java.io.File(hostdir, "c"));
	// 								createFile(new Packages.java.io.File(hostfilec, "d"));
	// 								var hostfilee = createDirectory(new Packages.java.io.File(hostdir, "e"));
	// 								createFile(new Packages.java.io.File(hostfilee, "f"));

	// 								createFile(new Packages.java.io.File(hostdir, "target"), 1112);

	// 								dir = filesystem.java.adapt(hostdir).directory;
	// //								dir = filesystem.$unit.Pathname(module.filesystem.$unit.getNode(hostdir)).directory;
	// 							}

	// 							this.execute = function(scope) {
	// 								var filea = dir.getFile("a");
	// 								var fileb = dir.getFile("b");
	// 								var filec = dir.getSubdirectory("c");
	// 								var filed = filec.getFile("d");
	// 								var filee = dir.getSubdirectory("e");
	// 								var filef = filee.getFile("f");
	// 							}
	// 						} );
	// 					}
	// 				}

					return {
						UNIX
					}
				}
			)();

			fifty.tests.filesystem = function(fs: slime.jrunscript.file.Filesystem) {
				var Pathname = fs.Pathname;
				var test = function(b: boolean) {
					verify(b).is(true);
				};
				if (UNIX) {
					var foo = Pathname("/foo");
					verify(foo).parent.toString().is("");
					verify(foo).parent.directory.toString().is("/");
//						test( Pathname("/foo").parent.toString() == "/" );
					test( Pathname("/foo/bar").parent.toString() == "/foo" );
					test( Pathname("/").parent == null );
					test( Pathname("/").directory.list()[0].pathname.toString().substring(0,2) != "//" );
					test( Pathname("a").toString().length != 1 );
				} else {
					test( Pathname("C:\\cygwin").parent.toString() == "C:\\" );
					test( Pathname("C:\\cygwin\\tmp").parent.toString() == "C:\\cygwin" );
					test( Pathname("C:\\").parent == null );
				}

				if (UNIX) {
					test( Pathname("/home/inonit").basename == "inonit" );
					test( Pathname("/home").basename == "home" );
					test( Pathname("/").basename == "" );
				} else {
					test( Pathname("C:\\cygwin\\tmp").basename == "tmp" );
					test( Pathname("C:\\cygwin").basename == "cygwin" );
					test( Pathname("C:\\").basename == "C:\\" );
				}
			};

			fifty.tests.softlink = function() {
				var script: internal.test.fixtures.Script = fifty.$loader.script("../fixtures.ts");
				var fixtures = script({ fifty: fifty, prefix: "../" });

				const { context, module, newTemporaryDirectory, createFile, createDirectory, filesystem } = fixtures;

				var scope = (
					function(scope) {
						var module = fixtures.module;
						var filesystem = fixtures.filesystem;
						var createFile = fixtures.createFile;
						var createDirectory = fixtures.createDirectory;

						if (jsh.shell.PATH.getCommand("ln")) {
							var tmpdir = fixtures.newTemporaryDirectory();
							var hostdir = new Packages.java.io.File(tmpdir.pathname.java.adapt(), "hostdir");
							hostdir.mkdirs();
							var linkdir = new Packages.java.io.File( tmpdir.pathname.java.adapt(), "linkdir" );
							linkdir.mkdirs();
							var linkpathname = filesystem.java.adapt(linkdir);
							var hostpathname = filesystem.java.adapt(hostdir);
							var target = createFile(hostpathname.directory,"target",1112);
							var c = createDirectory(hostpathname.directory,"c");

							var shell = function(command,args) {
								Packages.inonit.system.OperatingSystem.get().execute( command, args ).evaluate();
							}

							var LN_PATH;
							if (module.filesystems.cygwin) {
								LN_PATH="c:/cygwin/bin/ln";
							} else {
								LN_PATH="/bin/ln";
							}
							shell(LN_PATH, [ "-s",
								hostpathname.directory.getRelativePath("target").toString(),
								linkpathname.directory.getRelativePath("to_target").toString()
							] );
							shell(LN_PATH, [ "-s",
								hostpathname.directory.getRelativePath("c").toString(),
								linkpathname.directory.getRelativePath("to_c").toString()
							] );
							shell(LN_PATH, [ "-s",
								linkpathname.directory.getRelativePath("to_c").toString(),
								linkpathname.directory.getRelativePath("to_to_c").toString()
							] );
							shell(LN_PATH, [ "-s",
								hostpathname.directory.getRelativePath("does_not_exist").toString(),
								linkpathname.directory.getRelativePath("to_nowhere").toString()
							] );
							scope._linkdir = linkdir;
							scope.linkdir = filesystem.java.adapt(scope._linkdir).directory;
							scope.hostdir = hostdir;
							var _createFile = function(_dir,path) {
								var dir = filesystem.java.adapt(_dir).directory;
								createFile(dir,path);
							}

							scope._createFile = _createFile;

							var before = scope.linkdir.getRelativePath("to_c").directory.list().length;
							scope.before = before;
							scope.filelink = scope.linkdir.getRelativePath("to_target").file;
							scope.dirlink = scope.linkdir.getRelativePath("to_c").directory;
							scope.ln = jsh.shell.PATH.getCommand("ln");
						}

						return scope;
					}
				)({
					_linkdir: void(0),
					linkdir: void(0),
					hostdir: void(0),
					_createFile: void(0),
					before: void(0),
					filelink: void(0),
					dirlink: void(0),
					ln: void(0)
				});

				fifty.run(
					function _1() {
						var { linkdir, filelink } = scope;
						if (scope.ln) {
							test( linkdir != null );
							test( linkdir.directory );

							test( linkdir.getRelativePath("to_target").file != null );

							ftest( function() {
									var reader = filelink.read(context.$Context.api.io.Streams.binary);
									var instream = reader.java.adapt();
									var len = 0;
									while( instream.read() != -1 ) {
										len++;
									}
									instream.close();
									return len == 1112;
								},
								"file is of correct size."
							);
							ftest( function() {
									return filelink.parent.toString() == linkdir.toString();
								},
								"Softlink parent works correctly."
							);
							test( !filelink.directory );

							test(linkdir.getRelativePath("to_c").directory != null);
						}
					}
				);

				fifty.run(
					function _2() {
						const { linkdir, before } = scope;
						if (scope.ln) {
							var File = Packages.java.io.File;
							scope._createFile( scope.hostdir, "c/c1" );
							scope._createFile( scope.hostdir, "c/c2" );
							test(linkdir.getRelativePath("to_c").directory.list().length == before+2);
						}
					}
				);

				fifty.run(
					function _3() {
						const { linkdir } = scope;
						if (scope.ln) {
							var dir = fixtures.filesystem.java.adapt(scope.hostdir).directory;
							scope.filelink.remove();
							var dirlist = dir.getSubdirectory("c").list();

							test( linkdir.getRelativePath("to_target").file == null );
							test( dir.getRelativePath("target").file != null );
							test( linkdir.getRelativePath("to_c").directory != null );
							linkdir.getRelativePath("to_c").directory.remove();
							verify(dir).getSubdirectory("c").list().length.is(dirlist.length);
							test( dir.getRelativePath("c").directory != null );
							test( linkdir.getRelativePath("to_c").directory == null );
							test( dir.getRelativePath("c").directory != null );
						}
					}
				);

				fifty.run(
					function _4() {
						const { linkdir } = scope;
						if (scope.ln) {
							test( linkdir.getRelativePath("to_nowhere").file == null );
							test( linkdir.getRelativePath("to_nowhere").directory == null );
							var list = linkdir.list();
							var toDelete;
							list.forEach(function(item) {
								test(item != null);
								test(item.parent.pathname.toString() == linkdir.pathname.toString());
								test(item.pathname.toString().substring(0,linkdir.pathname.toString().length) == linkdir.pathname.toString());
								test(item.directory === null);
								toDelete = item;
							});
							toDelete.remove();
							test(linkdir.list().length+1 == list.length);
						}
					}
				);

				// var linkToLink = linkdir.getRelativePath("to_to_c").directory;
				// test( linkToLink != null );
			}

			var getFilesystem = function() {
				return (module.filesystems.cygwin) ? module.filesystems.cygwin : module.filesystems.os;
			}

			fifty.tests.manual.fstest = function() {
				fifty.tests.filesystem(getFilesystem());
			}

			fifty.tests.suite = function() {
				var filesystem = getFilesystem();

				var fx = local.fixtures(module.filesystems.os);
				//	TODO	if Cygwin is present, we want to run on module.filesystems.cygwin, too, but that will require further
				//			modularization

				fifty.run(function fstest() {
					fifty.tests.filesystem(filesystem);
				});

				if (UNIX) {
					var top = jsh.file.Pathname("/").directory;
					var HOME = jsh.shell.HOME.toString();
					var home = top.getSubdirectory(HOME.substring(1));
					verify(home).is.not(null);
				}

				var { dir, filee } = fx;

				var NODE = dir.list.NODE;
				var ENTRY = dir.list.ENTRY;
				var RESOURCE = dir.list.RESOURCE;

				test(dir.list().length == 5);

				test( dir.list({ filter: /^.$/ }).length == 4 );
				test( dir.list({ filter: /../ }).length == 1 );
				test( dir.list({ filter: /a/ }).length == 2 );
				test( dir.list({ filter: /ar/ }).length == 1 );
				test( dir.list({ filter: /foobar/ }).length == 0 );

				var descendants = {
					all: function(dir) {
						return true;
					}
				}
				test( dir.list({ descendants: descendants.all }).length == 7 );
				test( dir.list({ filter: /c/, descendants: descendants.all }).length == 1 );
				test( dir.list({ filter: /d/, descendants: descendants.all }).length == 1 );

				var filter = function(node) {
					var basename = node.pathname.basename;
					if (basename == "a") return true;
					if (basename == "b") return true;
					if (basename == "c") return false;
					if (basename == "d") return true;
					if (basename == "e") return false;
					if (basename == "f") return true;
					if (basename == "target") return false;
				};
				test(dir.list({ filter: filter, descendants: function(dir) {
					if (dir.pathname.basename == "c") return true;
					return filter(dir);
				} }).length == 3);

				var e_entries = filee.list({ type: ENTRY });
				test(e_entries.length == 1);
				test(e_entries[0].node.pathname.basename == "f");
				test(e_entries[0].path == "f");

				var entries = dir.list({ type: ENTRY, descendants: descendants.all });
				var entryf = entries.filter( function(entry) {
					return entry.path == ["e","f"].join(filesystem.$unit.getPathnameSeparator());
				} );
				test(entryf.length == 1);
				var entrye = entries.filter( function(entry) {
					return entry.path == "e" + filesystem.$unit.getPathnameSeparator();
				} );
				test(entrye.length == 1);
				var entryf0 = entryf[0];
				test(entryf0.node.pathname.basename == "f");

				var resources = dir.list({ type: RESOURCE, descendants: descendants.all });
				var resourcef = resources.filter( function(resource) {
					return resource.path == "e/f";
				} );
				test(resourcef.length == 1);
				var resourcef0 = resourcef[0];
				test(resourcef0.resource.read(String) == "");

				test(
					dir.list({
						filter: function(node) {
							return true;
						},
						descendants: function(node) {
							return true;
						}
					}).length == 7
				);

				if (context.cygwin) {
					(
						function() {
							debugger;
							var link = function(target,link) {
								jsh.shell.shell(
									jsh.file.Pathname("/bin/ln").toString(),
									[
										"-s",
										target.toString(),
										link.toString()
									],
									{
									}
								);
							};

							var dir = jsh.shell.TMPDIR.createTemporary({ directory: true });

							var newFile = function(path) {
								dir.getRelativePath(path).write(path, { append: false });
								return dir.getFile(path);
							}

							var newDir = function(path) {
								return dir.getRelativePath(path).createDirectory();
							}

							var dirtarget = newDir("dirtarget");
							var filetarget = newFile("filetarget");

							var list = newDir("list");
							link(dirtarget.pathname,list.getRelativePath("softdir"));
							link(filetarget.pathname,list.getRelativePath("softfile"));
							var hardfile = newFile("list/hardfile");
							var harddir = newDir("list/harddir");

							test(list.list().length == 4);
							var nodes: Node[] = list.list();
							nodes.sort(function(a,b) {
								if (a.pathname.basename < b.pathname.basename) return -1;
								if (b.pathname.basename < a.pathname.basename) return 1;
								return 0;
							});
							var getWindowsTargetName = function(node) {
								var winpath = module.filesystems.cygwin.toWindows(node.pathname);
								return winpath.toString().split("\\").slice(-1)[0];
							}
							test(getWindowsTargetName(nodes[0]) == "harddir");
							test(getWindowsTargetName(nodes[1]) == "hardfile");
							test(getWindowsTargetName(nodes[2]) == "dirtarget");
							test(getWindowsTargetName(nodes[3]) == "filetarget");
						}
					)();
				}

				fifty.run(fifty.tests.createDirectory);

				fifty.run(fifty.tests.Node);

				fifty.run(fifty.tests.File);

				fifty.run(fifty.tests.softlink);
			}
		}
	//@ts-ignore
	)(Packages,fifty);
}

namespace slime.jrunscript.file.internal.file {
	export type firstDefined = <T extends { [x: string]: any }>(o: T, ...names: (keyof T)[]) => any

	export interface Context {
		library: {
			java: slime.jrunscript.java.Exports
		}
		Resource: slime.jrunscript.io.Exports["Resource"]
		Streams: slime.jrunscript.io.Exports["Streams"]
		filesystems: Pick<slime.jrunscript.file.Exports["world"]["filesystems"],"os">
		prototypes: {
			Searchpath: {}
		}
		pathext: string[]
	}

	export interface Exports {
		Pathname: new (parameters: {
			provider: slime.jrunscript.file.internal.java.FilesystemProvider
			path: string
		}) => Pathname

		Searchpath: new (parameters: {
			fs?: slime.jrunscript.file.world.Filesystem
			provider: slime.jrunscript.file.internal.java.FilesystemProvider
			array: slime.jrunscript.file.Pathname[]
		}) => any

		//	TODO	the constructor for Pathname is really filesystem/peer or filesystem/path

		isPathname: (item: any) => item is slime.jrunscript.file.Pathname

		list: slime.jrunscript.file.Exports["list"]
	}

	export type Script = slime.loader.Script<Context,Exports>
}
