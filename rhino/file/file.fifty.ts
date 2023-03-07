//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
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

			var script: test.fixtures.Script = fifty.$loader.script("fixtures.ts");
			var fixtures = script({ fifty: fifty });

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
			adapt: () => slime.jrunscript.file.world.Location
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
				var file = fifty.jsh.file.object.getRelativePath("api.html").file;
				var parent = file.parent;
				verify(parent,"parent").getFile("api.html").evaluate(String).is(fifty.jsh.file.object.getRelativePath("api.html").file.toString());
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Node {
		copy: ((
			pathname: Pathname | Directory,
			mode?: {
				filter?: (p: {
					entry: {
						path: string
						node: slime.jrunscript.file.Node
					},
					exists: slime.jrunscript.file.Node
				}) => boolean

				recursive?: any
			}
		) => this) & {
			filter: any
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var script: test.fixtures.Script = fifty.$loader.script("fixtures.ts");
			var fixtures = script({ fifty: fifty });

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

			const test = function(b) {
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

					verify(_permissions.contains(Packages.java.nio.file.attribute.PosixFilePermission.OWNER_EXECUTE)).is(true);

					tmpdir.getFile("a").copy(tmpdir.getRelativePath("b"));
					var _p2 = _getPermissions(tmpdir.getFile("b"));
					verify(_p2.contains(Packages.java.nio.file.attribute.PosixFilePermission.OWNER_EXECUTE)).is(true);
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

	export interface File extends Node {
		read: {
			(p: StringConstructor): string
			(p: any): any
		}
		length: any
	}

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

	export interface Exports {
		list: {
			/**
			 * Use {@link Node} objects when listing files.
			 */
			NODE: slime.jrunscript.file.directory.list.Format<slime.jrunscript.file.Node>

			/**
			 * Returns {@link Node}s, along with their relative paths, when listing files.
			 */
			ENTRY: slime.jrunscript.file.directory.list.Format<{
				/**
				 * The path, relative to the listed directory, at which this node can be found.
				 */
				path: string
				node: slime.jrunscript.file.Node
			}>

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
		getFile: (path: string) => File
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

			function test(b: boolean) {
				verify(b).is(true);
			}

			var script: test.fixtures.Script = fifty.$loader.script("fixtures.ts");
			var fixtures = script({ fifty: fifty });

			const { context, module, newTemporaryDirectory, createFile, createDirectory } = fixtures;

			fifty.tests.suite = function() {
				var filesystem = (module.filesystems.cygwin) ? module.filesystems.cygwin : module.filesystems.os;
				var dir = newTemporaryDirectory(filesystem);

				var filea = createFile(dir,"a");
				var fileb = createFile(dir,"b");
				var filec = createDirectory(dir,"c");
				var filed = createFile(filec,"d");
				var filee = createDirectory(dir,"e");
				var filef = createFile(filee,"f");

				createFile(dir,"target",1112);

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
									jsh.file.Pathname("/bin/ln"),
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
			}
		}
	//@ts-ignore
	)(Packages,fifty);
}

namespace slime.jrunscript.file.internal.file {
	export type firstDefined = <T extends { [x: string]: any }>(o: T, ...names: (keyof T)[]) => any

	export interface Context {
		library: {
			java: slime.jrunscript.host.Exports
		}
		Resource: slime.jrunscript.io.Exports["Resource"]
		Streams: slime.jrunscript.io.Exports["Streams"]
		filesystems: slime.jrunscript.file.World["spi"]["filesystems"]
		pathext: string[]
	}

	export interface Exports {
		Searchpath: new (parameters: {
			filesystem: slime.jrunscript.file.internal.java.FilesystemProvider
			array: slime.jrunscript.file.Pathname[]
		}) => any

		//	TODO	the constructor for Pathname is really filesystem/peer or filesystem/path

		Pathname: new (parameters: {
			filesystem: slime.jrunscript.file.internal.java.FilesystemProvider
			peer?: slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node
			path?: string

			$filesystem?: slime.jrunscript.file.internal.java.FilesystemProvider
			$peer?: slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node
			$path?: any
		}) => Pathname

		isPathname: (item: any) => item is slime.jrunscript.file.Pathname

		list: slime.jrunscript.file.Exports["list"]
	}

	export type Script = slime.loader.Script<Context,Exports>
}
