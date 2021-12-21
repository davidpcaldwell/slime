//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
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
			<T>(mode?: directory.list.Settings<T>): T[]

			(mode?: Pick<directory.list.Settings<Node>,"filter" | "descendants" | "recursive">): Node[]

			/** @deprecated Use {@link Exports | Exports.list.RESOURCE } */
			RESOURCE: Exports["list"]["RESOURCE"]

			/** @deprecated Use {@link Exports | Exports.list.ENTRY } */
			ENTRY: Exports["list"]["ENTRY"]
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			function test(b: boolean) {
				verify(b).is(true);
			}

			const api = (
				function() {
					var java = fifty.$loader.module("../../jrunscript/host/", {
						$slime: jsh.unit.$slime,
						logging: {
							prefix: "slime.jrunscript.file.test"
						}
					});
					return {
						js: fifty.$loader.module("../../js/object/"),
						java: java,
						io: fifty.$loader.module("../../jrunscript/io/", {
							$slime: jsh.unit.$slime,
							api: {
								java: java,
								mime: jsh.unit.$slime.mime
							}
						})
					}
				}
			)();

			const context: Context & { $Context: any } = (
				Object.assign(
					function(p) {
						var cygwin = (p && p.cygwin) ? (function() {
							var System = Packages.java.lang.System;
							var rv = {
								root: String( System.getProperty("cygwin.root") ),
								paths: void(0)
							};
							if (System.getProperty("cygwin.paths")) {
								//	Using the paths helper currently does not seem to work in the embedded situation when running inside
								//	the SDK server
								//	TODO	check this
								rv.paths = String( System.getProperty("cygwin.paths") );
							}
							return rv;
						})() : void(0);
						return {
							api: api,
							pathext: (jsh.shell.environment.PATHEXT) ? jsh.shell.environment.PATHEXT.split(";") : void(0),
							$pwd: String(jsh.shell.properties.object.user.dir),
							$slime: jsh.unit.$slime,
							addFinalizer: jsh.loader.addFinalizer,
							cygwin: cygwin,
							$Context: arguments.callee
						}
					},
					{
						api: api
					}
				)
			)(void(0))

			const module = fifty.$loader.module("module.js", context);

			let filesystem: Filesystem;

			//	TODO	this comes from api.html, and could be factored out into a fixtures file, which could shorten api.html

			var $jsapi = {
				java: {
					io: {
						newTemporaryDirectory: (function() {
							var tmpdir;

							var tmppath = function() {
								var path = Packages.java.lang.System.getProperty("java.io.tmpdir");
								var pathname = new Packages.java.text.SimpleDateFormat("yyyy.MM.dd.HH.mm.ss.SSS").format( new Packages.java.util.Date() );
								var dir = new Packages.java.io.File(new Packages.java.io.File(path), "jsunit/" + pathname);
								dir.mkdirs();
								return dir;
							};

							return function() {
								if (!tmpdir) tmpdir = tmppath();
								var rv = Packages.java.io.File.createTempFile("tmpdir-",".tmp",tmpdir);
								rv["delete"]();
								var success = rv.mkdirs();
								if (!success) {
									throw new Error("Failed to create " + rv);
								}
								return rv;
							};
						})()
					}
				}
			};

			var scope = {
				$jsapi: $jsapi
			}

			const helpers = new function() {
				var module: Exports;

				this.initialize = function(exports: Exports) {
					module = exports;
					filesystem = (module.filesystems.cygwin) ? module.filesystems.cygwin : module.filesystems.os;
				}

				//	Although this is equivalent to jsh.file.TMP.createTemporary({ directory: true }), we use a separate copy here because we want the
				//	calls to go to the module being tested, not the module executing the test environment
				this.newTemporaryDirectory = function(): Directory {
					var $dir: slime.jrunscript.native.java.io.File = scope.$jsapi.java.io.newTemporaryDirectory();
					return filesystem.java.adapt($dir).directory;
//					return scope.filesystem.$unit.Pathname(scope.filesystem.$unit.getNode($dir)).directory;
				}

				this.createFile = function(base,name,length) {
					var pathname = base.getRelativePath(name);
					//	Why the below is qualified with 'this' is a little mysterious
					if (true) {
						//	NASHORN	Nashorn requires the use of scope to access context, even though when scope.createFile is
						//			invoked below, scope should == this. In Rhino it does, but in Nashorn it does not.
						var out = pathname.write(context.$Context.api.io.Streams.binary);
					} else {
						var out = pathname.write(this.context.$Context.api.io.Streams.binary);
					}
					if (length) {
						for (var i=0; i<length; i++) {
							out.java.adapt().write(0);
						}
					}
					out.close();
					return pathname.file;
				}

				this.createDirectory = function(base,name) {
					return base.getRelativePath(name).createDirectory();
				}
			};

			helpers.initialize(module);

			const { newTemporaryDirectory, createFile, createDirectory } = helpers;

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
				entryf = entryf[0];
				test(entryf.node.pathname.basename == "f");

				var resources = dir.list({ type: RESOURCE, descendants: descendants.all });
				var resourcef = resources.filter( function(resource) {
					return resource.path == "e/f";
				} );
				test(resourcef.length == 1);
				resourcef = resourcef[0];
				test(resourcef.resource.read(String) == "");

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
			}
		}
	//@ts-ignore
	)(Packages,fifty);
}