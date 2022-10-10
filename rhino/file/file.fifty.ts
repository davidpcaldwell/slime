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
		createDirectory: {
			(p?: {
				exists?: (d: Directory) => boolean
				recursive?: boolean

				/** @deprecated Use `exists`. */
				ifExists?: (d: Directory) => boolean
			}): Directory
		}
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

		write: slime.jrunscript.runtime.old.Resource["write"]

		/**
		 * An object representing the file located at the location of this `Pathname`, or `null` if a (non-directory) file with
		 * this `Pathname` does not exist.
		 */
		readonly file: File

		readonly directory: Directory

		os: {
			adapt: () => slime.jrunscript.file.world.Location
		}

		java: {
			adapt: () => slime.jrunscript.native.java.io.File
		}
	}

	export namespace pathname {
		export interface WriteMode {
			append?: boolean
			recursive?: boolean

			/** @deprecated Replaced by `append` (with opposite semantics). */
			overwrite?: boolean
		}
	}

	export interface Node {
		pathname: Pathname
		directory: boolean
		remove: () => void,
		parent: Directory,
		copy: (
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
		) => Node
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
