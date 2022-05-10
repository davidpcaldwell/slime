//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.test {
	export interface Fixtures {
		$jsapi: {
			java: {
				io: {
					newTemporaryDirectory: () => slime.jrunscript.native.java.io.File
				}
			}
		}
		context: slime.jrunscript.file.Context & { $Context: any }
		module: Exports
		newTemporaryDirectory: (filesystem?: any) => slime.jrunscript.file.Directory
		createFile: any
		createDirectory: any
	}

	export namespace fixtures {
		export interface Context {
			fifty: slime.fifty.test.Kit
		}

		export type Script = slime.loader.Script<Context,Fixtures>
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			$context: slime.jrunscript.file.test.fixtures.Context,
			$export: slime.loader.Export<slime.jrunscript.file.test.Fixtures>
		) {
			const { fifty } = $context;
			const { jsh } = fifty.global;

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

							return function(filesystem?: any) {
								if (filesystem && filesystem === module.filesystems.cygwin) throw new TypeError("filesystem is cyginw");
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

			const module: Exports = fifty.$loader.module("module.js", context);

			let filesystem: Filesystem;

			const helpers = new function() {
				var module: Exports;

				this.initialize = function(exports: Exports) {
					module = exports;
					filesystem = (module.filesystems.cygwin) ? module.filesystems.cygwin : module.filesystems.os;
				}

				//	Although this is equivalent to jsh.file.TMP.createTemporary({ directory: true }), we use a separate copy here because we want the
				//	calls to go to the module being tested, not the module executing the test environment
				this.newTemporaryDirectory = function(fs?: any): Directory {
					var $dir: slime.jrunscript.native.java.io.File = $jsapi.java.io.newTemporaryDirectory(fs);
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

			$export({
				$jsapi: $jsapi,
				module: module,
				context: context,
				newTemporaryDirectory: helpers.newTemporaryDirectory,
				createFile: helpers.createFile,
				createDirectory: helpers.createDirectory
			});
		}
	//@ts-ignore
	)(Packages,$context,$export);
}
