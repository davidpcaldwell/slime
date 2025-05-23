//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The Java runtime extends the SLIME runtime to support Java-specific capabilities. Its methods are ordinarily not available to
 * Java-based SLIME embeddings directly.
 *
 * The SLIME Java runtime comes with two engine embeddings: one for the Rhino JavaScript engine provided by Mozilla, and one for the
 * Nashorn engine included with Java 8-14 (and available as a standalone library for Java 15 and up). The engine embeddings are
 * expressions that evaluate to an object. They provide different scope variables for implementing the embedding;
 * {@link slime.jrunscript.runtime.internal.rhino.Scope} for Rhino, and {@link slime.jrunscript.runtime.internal.nashorn.Scope} for
 * Nashorn.
 *
 * For each engine, two embeddings are included: a servlet-based embedding and an embedding that supports
 * `jsh`.
 *
 * If the underlying engine is Rhino, the {@link slime.runtime.Engine} implementation's `debugger` property is implemented in terms
 * of the Rhino debugger.
 *
 * ## Changes to `$api`
 *
 * The Java runtime replaces the `Type.fromName` function of {@link slime.$api.mime.Export} with a version that uses the
 * `java.net.URLConnection` implementation to resolve MIME types unresolved by SLIME. See {@link slime.jrunscript.mime.FromName}.
 */
namespace slime.jrunscript.runtime {
	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			return fifty.global.jsh.unit.$slime;
		//@ts-ignore
		})(fifty);
	}

	export namespace mime {
		//	TODO	the customized types should probably be moved to the `jrunscript` property added to the `$api` object,
		//			and the implementation should simply match the type of the underlying `$api` implementation

		/**
		 * Replaces `$api.mime.Type.fromName` in the SLIME Java environment.
		 *
		 * Delegates to the SLIME implementation, but if SLIME cannot determine the MIME type, adds the `java.net.URLConnection`
		 * implementation as a second source of MIME types. See the
		 * {@link slime.$api.mime.Export | SLIME runtime documentation} for details. Also adds
		 * properties representing the separate implementations, as follows.
		 */
		export type FromName = slime.$api.mime.Export["Type"]["fromName"] & {
			/**
			 * The original SLIME implementation.
			 */
			slime: slime.$api.mime.Export["Type"]["fromName"]

			java: {
				URLConnection: (p: {
					/** A filename. */
					name: string
				}) => slime.mime.Type
			}
		}
	}

	export namespace old {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.jsapi = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		/**
		 * An object describing a resource, which adds additional properties to the SLIME loader definition of the type.
		 */
		export interface Resource<JA = (path: string) => slime.jrunscript.native.inonit.script.engine.Code.Loader.Resource> extends slime.Resource {
			/**
			 * Provides the content of this resource, or a stream from which to read it. Extends the standard `read()`
			 * implementation from the SLIME runtime Resource with Java-specific types and the ability to obtain Java streams from
			 * the resource.
			 */
			read: slime.Resource["read"] & {
				//	TODO	Java-specific
				(p: slime.jrunscript.PropertiesJavaClass): slime.jrunscript.native.java.util.Properties

				//	TODO	Java-specific
				(p: slime.jrunscript.runtime.io.Exports["Streams"]["binary"]): slime.jrunscript.runtime.io.InputStream

				/**
				 * (if content can be read as a byte stream) Reads the content of this resource as a byte stream.
				 * @returns A stream that can provide the content of this resource.
				 */
				binary: () => slime.jrunscript.runtime.io.InputStream

				/**
				 * (if content can be read as a character stream) Reads the content of this resource as a character stream.
				 * @returns A stream that can provide the content of this resource.
				 */
				text: () => slime.jrunscript.runtime.io.Reader

				/**
				 * (if content can be read as a character stream) Iterates through the lines in this stream.
				 */
				lines: slime.jrunscript.runtime.io.old.ReadLines
			}

			/**
			 * (conditional) The length of this resource, in bytes.
			 */
			length?: number

			//	TODO	is this a Date? Actually, looks like a number (a Java long presumably typecast)
			/**
			 * The modification time of this resource. Datatype may change in future releases.
			 */
			modified?: any

			/**
			 * (optional: if resource is writable) Writes content to this resource, or returns a stream to which content can be
			 * written to write content to this resource.
			 *
			 * If the first argument is is `Streams.binary` or `Streams.text`, this method opens a stream and returns it. If the
			 * argument is a string, this method opens a character stream, writes the string to the stream, and closes the stream.
			 * If the value is a {@link slime.jrunscript.native.java.util.Properties}, this method opens a character stream, writes
			 * the properties to the resource, and closes the stream. If the value is an {@link slime.external.e4x.XML} or {@link
			 * slime.external.e4x.XMLList}, the value is serialized as XML and written to the resource, If the value is a binary or
			 * character input stream, this method reads the stream until it is exhausted and copies its contents to the resource,
			 * closing the stream after doing so.
			 *
			 * @returns See the description of the method; the return type depends on the arguments.  May return a binary output
			 * stream, a character output stream, or `undefined`.
			 */
			write?: {
				(marker: slime.jrunscript.runtime.io.Exports["Streams"]["binary"], mode?: resource.WriteMode): slime.jrunscript.runtime.io.OutputStream
				(marker: slime.jrunscript.runtime.io.Exports["Streams"]["text"], mode?: resource.WriteMode): slime.jrunscript.runtime.io.Writer
				(input: slime.jrunscript.runtime.io.InputStream, mode?: resource.WriteMode): void
				(input: slime.jrunscript.runtime.io.Reader, mode?: resource.WriteMode): void
				(input: string, mode?: resource.WriteMode): void
				(input: slime.jrunscript.native.java.util.Properties, mode?: resource.WriteMode): void
				(input: slime.external.e4x.XML, mode?: resource.WriteMode): void
				(input: slime.external.e4x.XMLList, mode?: resource.WriteMode): void
			}

			java?: {
				adapt: JA
			}
		}

		(
			function(
				Packages: slime.jrunscript.Packages,
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const module = test.subject;

				fifty.tests.jsapi.Resource = fifty.test.Parent();

				fifty.tests.jsapi.Resource.source = fifty.test.Parent();

				fifty.tests.jsapi.Resource.source._1 = function() {
					const readString = function(resource: slime.jrunscript.runtime.old.Resource) {
						return resource.read(String);
					};

					var buffer = new module.io.Buffer();
					var writer = buffer.writeText();
					writer.write("Buffer");
					buffer.close();
					var resource = new module.Resource({
						stream: {
							binary: buffer.readBinary()
						}
					});
					verify(resource).evaluate(readString).evaluate(String).is("Buffer");
					verify(resource).evaluate(readString).evaluate(String).is("Buffer");
				};

				fifty.tests.jsapi.Resource.source._2 = function() {
					var readJson = function(resource: slime.jrunscript.runtime.old.Resource): { foo: string } {
						return resource.read(JSON) as { foo: string };
					}
					var buffer = new module.io.Buffer();
					var writer = buffer.writeText();
					writer.write(JSON.stringify({ foo: "bar" }));
					buffer.close();
					var resource = new module.Resource({
						stream: {
							binary: buffer.readBinary()
						}
					});
					verify(resource).evaluate(readJson).foo.evaluate(String).is("bar");
					verify(resource).evaluate(readJson).foo.evaluate(String).is("bar");
				}

				fifty.tests.jsapi.Resource.read = fifty.test.Parent();

				fifty.tests.jsapi.Resource.read.properties = function() {
					var lines = [
						"foo.bar=baz"
					];
					var resource = new module.Resource({
						read: {
							string: function() { return lines.join("\n"); }
						}
					}) as slime.jrunscript.runtime.old.Resource;
					var _properties = resource.read(Packages.java.util.Properties);
					var properties = {
						getProperty: function(name) {
							var rv = _properties.getProperty(name);
							if (rv === null) return null;
							return String(rv);
						}
					};
					verify(properties).getProperty("foo.bar").is("baz");
					verify(properties).getProperty("foo.baz").is(null);
					// 	TODO	write test that specifies resource by string and then reads it as character stream and gets same
					//			string
				};

				fifty.tests.jsapi.Resource.read.lines = function() {
					const test = function(b: boolean) {
						verify(b).is(true);
					};

					var string = "Hello\nWorld";
					var buffer = new module.io.Buffer();
					// TODO: writeText() below?
					buffer.writeBinary().character().write(string);
					buffer.close();
					var resource = new module.Resource({
						stream: {
							binary: buffer.readBinary()
						}
					});
					var lines = [];
					resource.read.lines(function(item) {
						lines.push(item);
					}, { ending: "\n" });
					test(lines[0] == "Hello");
					test(lines[1] == "World");
				}
			}
		//@ts-ignore
		)(Packages,fifty);

		export namespace resource {
			/**
			 * An object that implements this resource, adding additional properties to the SLIME runtime definition.
			 */
			export interface Descriptor extends slime.resource.Descriptor {
				/**
				 * An object providing implementations for reading this resource. Adds two properties to the SLIME
				 * runtime definition.
				 */
				read?: slime.resource.ReadInterface & {
					/**
					 * Returns a byte stream representing this resource. This call should be idempotent; repeated calls should
					 * return new byte streams pointing to the beginning of the Resource's data.
					 *
					 * @returns A stream for reading this resource.
					 */
					binary?: () => slime.jrunscript.runtime.io.InputStream

					/**
					 * Returns a character stream representing this resource. This call should be idempotent; repeated calls should
					 * return new character streams pointing to the beginning of the Resource's data.
					 *
					 * @returns A stream for reading this resource.
					 */
					text?: any
				}

				length?: number

				modified?: any

				/**
				 * An object providing an implementation for writing to this resource.
				 */
				write?: {
					/**
					 * Returns a byte stream for writing to this resource.
					 */
					binary?: (mode: slime.jrunscript.runtime.old.resource.WriteMode) => slime.jrunscript.runtime.io.OutputStream

					/**
					 * Returns a character stream for writing to this resource.
					 */
					text?: (mode: slime.jrunscript.runtime.old.resource.WriteMode) => slime.jrunscript.runtime.io.Writer
				}
			}

			/**
			 * @deprecated
			 */
			export interface DeprecatedStreamDescriptor extends slime.resource.Descriptor {
				stream?: {
					/**
					 * A stream that can provide the source data for this resource. Note that the stream will be read and cached so
					 * that repeated calls to `read()` will return the same data.
					 */
					binary: slime.jrunscript.runtime.io.InputStream
				}
			}

			//	TODO	not even sure what this is
			export interface LoadedDescriptor extends Descriptor {
				_loaded?: {
					path: string
					resource: slime.jrunscript.native.inonit.script.engine.Code.Loader.Resource
				}
			}

			export type HistoricSupportedDescriptor = slime.resource.Descriptor | resource.Descriptor | resource.LoadedDescriptor | DeprecatedStreamDescriptor

			/**
			 * An object representing the mode of operation of {@link old.Resource} `write` operations.
			 */
			export interface WriteMode {
				/**
				 * What to do if the file already exists. If `true`, this method will append to, rather than overwriting, the file.
				 * If `false`, the file will be overwritten. Otherwise, an exception will be generated if the file exists.
				 */
				append?: boolean

				//	TODO	this comment is file-specific
				/**
				 * Whether to create the directory containing this Pathname if it does not already exist.
				 */
				recursive?: boolean
			}
		}

		export namespace loader {
			export interface Source extends slime.old.loader.Source {
				_source?: slime.jrunscript.native.inonit.script.engine.Code.Loader
				zip?: any
				_file?: any
				_url?: any
				/** @deprecated */
				resources?: any
			}
		}
	}

	export interface $javahost {
		debugger: slime.runtime.scope.$engine["debugger"]
		script: any
		MetaObject: any
		noEnvironmentAccess: any
		eval(a: any, b: any, c: any, d: any): any
	}

	/**
	 * The `jrunscript` (Java) runtime is loaded by loading an engine-specific script: either the `loader/jrunscript/rhino.js`
	 * script (for Rhino) or the `loader/jrunscript/nashorn.js` script (for Nashorn or GraalJS).
	 *
	 * Note that these are implemented by creating implementations of `$javahost` and `$bridge` and invoking `expression.js`.
	 *
	 * Then the generic container interface script `loader/jrunscript/expression.js` is evaluated, using the `$javahost` and
	 * `$bridge` objects in scope.
	 *
	 * * It first invokes `loader/expression.js`, using `$javahost` to provide appropriate implementations of `$slime` and
	 * `$engine`, to create the {@link slime.runtime.Exports | SLIME runtime}.
	 * *  It then post-processes the SLIME runtime to provide additional
	 * {@link slime.jrunscript.runtime.Exports | Java-specific properties}.
	 */
	export namespace internal {
	}

	export type sync = <F extends (...args: any[]) => any>(f: F, lock: any) => F

	export type MultithreadedJava = Exports["java"] & {
		sync: sync
		thisSynchronize: any
	}

	export interface Java {
		type(className: string): any
	}

	export namespace internal {
		export interface ZipFileSource {
			zip: {
				_file: any
			}
		}

		export interface ZipResourceSource {
			zip: {
				resource: any
			}
		}

		export interface JavaFileSource {
			_file: any
		}

		export interface JavaCodeLoaderSource {
			/**
			 * An object representing resources that can be loaded by this Loader.
			 */
			_source: slime.jrunscript.native.inonit.script.engine.Code.Loader
		}

		/**
		 * @deprecated
		 *
		 * An object that can return resources given paths.
		 */
		export interface DeprecatedResourcesSource {
			child?: any

			resources: {
				/**
				 * Returns an implementation for a resource at the given path.
				 * @param path A path.
				 * @returns An argument for the `Resource` constructor that implements the resource at the given path, or `null` if
				 * no resource is located at the given path.
				 */
				get: (path: string) => slime.jrunscript.runtime.old.resource.Descriptor & { string?: string }
			}
		}

		export type CustomSource = ZipFileSource | ZipResourceSource | JavaFileSource | JavaCodeLoaderSource | DeprecatedResourcesSource

		export type Source = slime.old.loader.Source | CustomSource
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export type JavaFileClasspathEntry = { _file: slime.jrunscript.native.java.io.File }
	export type SlimeClasspathEntry = { slime: { loader: slime.old.Loader } }
	export type JarFileClasspathEntry = { jar: { _file: slime.jrunscript.native.java.io.File } }
	export type JarResourceClasspathEntry = { jar: { resource: any } }
	export type SrcClasspathEntry = { src: { loader: slime.old.Loader } }
	export type ClasspathEntry = JavaFileClasspathEntry | SlimeClasspathEntry | JarFileClasspathEntry | JarResourceClasspathEntry | SrcClasspathEntry

	//	TODO	probably all jrunscript-specific properties should be properties of the `jrunscript` property; all properties added
	//			for this environment could be consolidated under that property
	/**
	 * The SLIME Java runtime supports a Java-based SLIME embedding, and extends the {@link slime.runtime.Exports | SLIME runtime}
	 * to support Java-specific capabilities: a `classpath`, the `jrunscript`, `java` and `io` interfaces,
	 * and Java-aware versions of `Resource`, `Loader`, and `mime`.
	 */
	export interface Exports extends slime.runtime.Exports {
		/**
		 * The Java implementation enhances the default {@link slime.$api.mime.Export} implementation in the same way as the
		 * `$api.mime` implementation is enhanced; see the {@link slime.jrunscript.runtime | "Changes to `$api`"} section.
		 */
		mime: slime.runtime.Exports["mime"]

		Resource: slime.runtime.Exports["Resource"] & {
			/**
			 * Creates a `Resource` which has additional capabilities beyond the SLIME runtime `Resource`.
			 */
			new (p: old.resource.HistoricSupportedDescriptor): slime.jrunscript.runtime.old.Resource
		}

		io: slime.jrunscript.runtime.io.Exports
		java: slime.jrunscript.runtime.java.Exports

		classpath: {
			setAsThreadContextClassLoaderFor: (_thread: slime.jrunscript.native.java.lang.Thread) => void
			getClass: (name: string) => slime.jrunscript.native.java.lang.Class
			add: (p: ClasspathEntry) => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit,
		) {
			const { verify, run } = fifty;
			const { jsh } = fifty.global;
			const { $slime } = jsh.unit;

			fifty.tests.exports.Resource = function() {
				var file: slime.jrunscript.runtime.old.resource.Descriptor = fifty.$loader.source.get("expression.fifty.ts") as slime.jrunscript.runtime.old.resource.Descriptor;
				var resource = new $slime.Resource({
					type: $slime.mime.Type.parse("application/x.typescript"),
					read: {
						binary: function() {
							return file.read.binary();
						}
					}
				});
				verify(resource).is.type("object");
				verify(resource).type.media.is("application");
				verify(resource).type.subtype.is("x.typescript");

				//	TODO	when running Fifty tests, this shows up as a 'run' child; should use function name ("streamIsCopied")
				//			if there is one
				function streamIsCopied() {
					var data = "foo!";
					var buffer = new $slime.io.Buffer();
					var stream = buffer.writeText();
					stream.write(data);
					stream.close();

					var resource = new $slime.Resource({
						stream: {
							binary: buffer.readBinary()
						}
					});

					var first = resource.read(String);
					var second = resource.read(String);
					verify(first).is(data);
					verify(second).is(data);
				};

				run(streamIsCopied);
			};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports extends slime.runtime.Exports {
		Loader: slime.runtime.Exports["old"]["Loader"] & {
			new (p: internal.CustomSource): Loader
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			const module = test.subject;

			fifty.tests.jsapi.Loader = fifty.test.Parent();

			fifty.tests.jsapi.Loader._1 = function() {
				const test = function(b: boolean) {
					fifty.verify(b).is(true);
				};

				var loader = new module.Loader({
					resources: {
						get: function(path) {
							var file = fifty.jsh.file.object.getRelativePath(path).file;
							if (!file) return null;
							var type = (function() {
								if (/\.jsh\.js$/.test(path)) {
									return module.mime.Type("application", "x.jsh");
								} else if (/\.js$/.test(path)) {
									return module.mime.Type("application", "javascript");
								} else if (/\.html$/.test(path)) {
									return module.mime.Type("text", "html");
								} else {
									return module.mime.Type("application", "octet-stream");
								}
							})();
							return {
								type: type,
								read: {
									binary: function() {
										return file.read(jsh.io.Streams.binary);
									}
								}
							};
						}
					}
				});

				var script = loader.get("expression.js");
				verify(script).type.evaluate(String).is("application/javascript");

				jsh.shell.console("Loading module ...");
				var loaderModule = loader.module("../../jrunscript/io/test/Loader.js");
				jsh.shell.console("Read module.");
				test(loaderModule.file.foo == "bar");
				test(loaderModule.resource("Loader.js") != null);
				test(loaderModule.resource("test/Loader.js") == null);
				test(loaderModule.grandchildResource("file.js") != null);
				test(loaderModule.grandchildResource("Loader/file.js") == null);
				test(loaderModule.grandchildResource("test/Loader/file.js") == null);
			};

			fifty.tests.jsapi.Loader._2 = function() {
				var sources = new function() {
					var code = {

					};

					this.get = function(path) {
						return null;
					};

					this.Loader = function(prefix) {
						this.list = function() {
							return [];
						}
					}
				}
				var loader = new module.Loader(sources);
				verify(loader).evaluate(function(p) { return p.run; }).is.not.equalTo(null);
				var child = loader.Child("prefix/");
				verify(child).evaluate(function(p) { return p.run; }).is.not.equalTo(null);
			}
		}
	//@ts-ignore
	)(fifty);

	/**
	 * A standardized interface for resources that eases interoperability between various kinds of Java-based loaders.
	 */
	export interface Resource {
		read: () => slime.jrunscript.runtime.io.InputStream
		length: () => slime.$api.fp.Maybe<number>

		/**
		 * Returns a modification time, in milliseconds since the UNIX epoch.
		 */
		modified: () => slime.$api.fp.Maybe<number>
	}

	export namespace loader {
		export interface Entry {
			path: string[]
			name: string
			resource: slime.jrunscript.runtime.Resource
		}

		export namespace entry {
			export type Loader = (location: slime.runtime.loader.Location) => loader.Entry
		}
	}

	export interface Exports extends slime.runtime.Exports {
		jrunscript: {
			loader: {
				from: {
					java: (
						_loader: slime.jrunscript.native.inonit.script.engine.Code.Loader
					) => slime.runtime.loader.Synchronous<slime.jrunscript.native.inonit.script.engine.Code.Loader.Resource>
				}
				entries: <T>(
					p: {
						filter: Parameters<slime.runtime.loader.Exports["synchronous"]["resources"]>[0],
						map: (t: T) => slime.jrunscript.runtime.Resource
					}
				) => (p: slime.runtime.loader.Synchronous<T>) => loader.Entry[]
			},
			Resource: {
				from: {
					java: (_resource: slime.jrunscript.native.inonit.script.engine.Code.Loader.Resource) => Resource
				}
			},
			entry: {
				Loader: {
					from: {
						synchronous: <T>(p: {
							loader: slime.runtime.loader.Synchronous<T>
							map: (t: T) => slime.jrunscript.runtime.Resource
						}) => loader.entry.Loader
					}
				}
			},
			Entry: {
				mostRecentlyModified: () => slime.$api.fp.Ordering<loader.Entry>
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
			const { $slime } = fifty.global.jsh.unit;

			var loader = $slime.jrunscript.loader.from.java(
				Packages.inonit.script.engine.Code.Loader.create(
					fifty.jsh.file.object.getRelativePath("../..").java.adapt()
				)
			);

			var getType = function(value: any): { type: string } {
				if (value === null) return { type: "null" };
				return { type: typeof value };
			}

			fifty.tests.exports.loader = function() {
				verify(getType($slime.loader)).type.is("object");
				verify(getType($slime.loader.synchronous)).type.is("object");
				verify(getType($slime.loader.synchronous.scripts)).type.is("function");

				fifty.load("../Loader.fifty.ts", "script", loader);
				fifty.load("../Loader.fifty.ts", "object", loader);
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports extends slime.runtime.Exports {
		$api: slime.$api.jrunscript.Global
	}
}

namespace slime.$api.jrunscript {
	export interface Global extends slime.$api.Global {
		jrunscript: {
			io: slime.jrunscript.runtime.io.Exports
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

		fifty.tests.jsapi.java_Code_Loader = function() {
			var $slime = jsh.unit.$slime;

			//	TODO	for some reason the below does not work; the verify wrapping of the $slime object goes into some kind of
			//			memory-exhausting loop.
			// verify($slime,"$slime").is.type("object");
			//	... because of what's described in the comment above, we use these two lines:
			verify({ type: typeof $slime }).evaluate.property("type").is("object")
			verify({ type: typeof $slime.Loader }).evaluate.property("type").is("function");
			var tmpdir = fifty.jsh.file.object.temporary.directory();
			tmpdir.getRelativePath("dir").createDirectory();
			tmpdir.getRelativePath("file").write("contents", { append: false });
			tmpdir.getRelativePath("dir/under").write("inside", { append: false });

			var _source = Packages.inonit.script.engine.Code.Loader.create(tmpdir.pathname.java.adapt());
			var loader = new $slime.Loader({
				_source: _source
			});
			verify(loader).get("file").is.not(null);
			var file = loader.get("file");
			verify(file)["modified"].is.type("object");
			verify(file)["modified"].evaluate(function(p) {
				jsh.shell.console("1");
				var dateType = (Date["was"]) ? Date["was"] : Date;
				if (!(p instanceof dateType)) {
					Packages.java.lang.System.err.println("modified = " + p);
					Packages.java.lang.System.err.println("modified.constructor = " + p.constructor);
					Packages.java.lang.System.err.println("Date = " + dateType);
				}
				return p instanceof dateType;
			}).is(true);
			verify(loader).get("dir/under").is.not(null);
			verify(loader).get("foo").is(null);
			verify(loader).evaluate.property("list").is.type("function");

			var list = loader.list();
			verify(loader).list().length.is(2);
			var child = loader.Child("dir/");
			verify(child).evaluate.property("list").is.type("function");
			verify(child).list().length.is(1);
		}

		fifty.tests.decoration = fifty.test.Parent();

		fifty.tests.decoration.mime = function() {
			var xmlType = $api.mime.Type.fromName("foo.xml");
			verify(xmlType).media.is("application");
			verify(xmlType).subtype.is("xml");
		}

		fifty.tests.suite = function() {
			verify(fifty.global.jsh.unit.$slime.$platform && typeof fifty.global.jsh.unit.$slime.$platform == "object").is(true);
			//verify(fifty.global.jsh).unit.$slime.$platform.is.type("object");

			fifty.run(fifty.tests.decoration);

			fifty.run(fifty.tests.exports);

			fifty.run(fifty.tests.jsapi);

			fifty.load("test/data/2/module.fifty.ts");

			//	TODO	redundant? tested per-engine in contributor/suite.jsh.js
			fifty.load("java.fifty.ts");
			fifty.load("io.fifty.ts");
		}
	}
//@ts-ignore
)(Packages,fifty);


(
	function(
		fifty: slime.fifty.test.Kit
	) {
		const { $api, jsh } = fifty.global;

		fifty.tests.manual = {};
		fifty.tests.manual.issue22 = function() {
			//	This test enables checking to see whether the stack trace emitted uses reasonable file names for files from the
			//	SLIME runtime.

			jsh.shell.console("Hello, World!");

			var code: slime.resource.Descriptor = {
				read: {
					string: function() {
						return "foobar";
					}
				}
			};

			//var x = $api.mime.Type.parse(void(0));

			jsh.loader.run(code, null, null);
		}
	}
//@ts-ignore
)(fifty);

namespace slime.external.e4x {
	export interface Object {
		toXMLString: () => string
	}

	export interface XML extends Object {
	}

	export interface XMLList extends Object {
		length(): number
	}

	declare const tag_XML: unique symbol;
	declare const tag_XMLList: unique symbol;

	export type XMLConstructor = {
		new (value: any): XML

		readonly [tag_XML]: "value"
	}

	export type XMLListConstructor = {
		new (value: any): XMLList

		readonly [tag_XMLList]: "value"
	}
}
