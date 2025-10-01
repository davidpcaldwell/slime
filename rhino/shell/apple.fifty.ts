//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.system.apple {
	export interface Context {
		api: {
			js: slime.$api.old.Exports
			document: slime.old.document.Exports
			shell: slime.jrunscript.shell.Exports
			xml: {
				parseFile: (file: slime.jrunscript.file.File) => slime.old.document.Document
			}
		}
	}

	export namespace osx {
		/**
		 * An object specifying properties to be added to the `Info.plist`. Properties with string values will be
		 * treated as name-value pairs. Some properties allow non-string values, as specified below. The
		 * `CFBundlePackageType` property is hard-coded to `APPL`, per Apple's specification. The following
		 * properties are also required to be supplied, per Apple's documentation (although SLIME provides a default
		 * value for one):
		 */
		export interface ApplicationBundleInfo {
			/**
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html)
			 */
			CFBundleName: string

			/**
			 * Apple says this value is required, but it does not appear to be required.
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleDisplayName?: string

			/**
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleIdentifier: string

			/**
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleVersion: string

			/**
			 * (optional; defaults to `????`; see [Stack
			 * Overflow](http://stackoverflow.com/questions/1875912/naming-convention-for-cfbundlesignature-and-cfbundleidentifier).)
			 *
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleSignature?: string

			//	TODO	document allowed object type with command (preceding comment copied from JSAPI)
			/**
			 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
			 */
			CFBundleExecutable: string | { name?: string, command: string }

			//	Added to make test pass type checking; not sure what this does
			CFBundleIconFile?: any
		}

		export interface ApplicationBundle {
			directory: slime.jrunscript.file.Directory
			info?: ApplicationBundleInfo
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		plist: {
			xml: {
				/**
				 * @param v A value to encode.
				 */
				encode: (v: any) => slime.old.document.Document

				/**
				 *
				 * @param xml An XML document representing a property list
				 * @returns The value represented by the property list.
				 */
				decode: (xml: slime.old.document.Document) => any
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			const fixtures: slime.jrunscript.shell.test.Script = fifty.$loader.script("fixtures.ts");

			const module = fixtures().load({
				api: {
					bootstrap: jsh.internal.bootstrap,
					document: jsh.js.document,
					file: jsh.file,
					io: jsh.io,
					java: jsh.java,
					js: jsh.js,
					xml: {
						parseFile: function(file) {
							return new jsh.document.Document({ string: file.read(String) });
						}
					}
				},
				stdio: {
					output: void(0),
					error: void(0)
				},
				kotlin: void(0)
			})

			fifty.tests.exports.plist = function() {
				var object: { a: string, b: { c: string } } = {
					a: "1",
					b: {
						c: "2"
					}
				};
				var xml = module.system.apple.plist.xml.encode(object);
				jsh.shell.console(xml.toString());
				var decoded: typeof object = module.system.apple.plist.xml.decode(xml);
				verify(decoded).a.is("1");
				verify(decoded).b.is.type("object");
				verify(decoded).b.c.is("2");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		osx: {
			/**
			 * Implements the creation of OS X [Application
			 * Bundles](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/Introduction/Introduction.html).
			 */
			ApplicationBundle: new (p: {
				/**
				 * The location at which to create the bundle.
				 */
				pathname: slime.jrunscript.file.Pathname

				info?: system.apple.osx.ApplicationBundleInfo
			}) => system.apple.osx.ApplicationBundle
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const subject = jsh.shell;

			fifty.tests.exports.osx = fifty.test.Parent();
			fifty.tests.exports.osx.ApplicationBundle = function() {
				if (subject.system.apple.osx && subject.system.apple.osx.ApplicationBundle) {
					var tmpfile = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("tmp.icns");
					tmpfile.write("ICONS", { append: false });
					var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
					tmp.directory.remove();
					var bundle = new subject.system.apple.osx.ApplicationBundle({
						pathname: tmp,
						info: {
							CFBundleName: "name",
							CFBundleIdentifier: "com.bitbucket.davidpcaldwell.slime",
							CFBundleVersion: "1",
							CFBundleExecutable: {
								name: "program",
								command: "ls"
							},
							CFBundleIconFile: {
								file: tmpfile.file
							}
						}
					});
					verify(bundle).directory.evaluate(String).is(tmp.directory.toString());
					verify(bundle).info.is.type("object");
					//	TODO	not sure what the below is for
					//@ts-ignore
					bundle.info = "foo";
					verify(bundle).info.is.type("object");
					verify(bundle).info.CFBundleName.is("name");
					verify(bundle).info.CFBundleIdentifier.is("com.bitbucket.davidpcaldwell.slime");
					verify(bundle).info.CFBundleVersion.is("1");
					verify(bundle).info.CFBundleExecutable.evaluate(String).is("program");
					verify(bundle).directory.getFile("Contents/MacOS/program").is.type("object");
					verify(bundle).directory.getFile("Contents/MacOS/executable").is.type("null");
					verify(bundle).directory.getFile("Contents/Resources/tmp.icns").is.type("object");

					bundle.info.CFBundleExecutable = "string";
					verify(bundle).info.CFBundleExecutable.evaluate(String).is("string");

					bundle.info.CFBundleExecutable = {
						name: "executable",
						command: "pwd"
					};
					verify(bundle).directory.getFile("Contents/MacOS/program").is.type("null");
					verify(bundle).directory.getFile("Contents/MacOS/executable").is.type("object");
					verify(bundle).directory.evaluate(function() {
						var file = this.getFile("Contents/MacOS/executable");
						if (!file) return null;
						return { string: file.read(String) };
					}).is.type("object");
				} else {
					var message = "ApplicationBundle not available on this system";
					verify(message).is(message);
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * @deprecated
		 */
		bundle: {
			/**
			 * @deprecated
			 */
			osx: new (p: {
				info: slime.jrunscript.shell.system.apple.osx.ApplicationBundleInfo
				command?: string
			}) => {
				command?: string
				write: (to: slime.jrunscript.file.Directory) => void
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
