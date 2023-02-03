//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime {
	export namespace old {
		export interface Resource<JA = (path: string) => slime.jrunscript.native.inonit.script.engine.Code.Loader.Resource> extends slime.Resource {
			read: slime.Resource["read"] & {
				binary: () => slime.jrunscript.runtime.io.InputStream
				text: () => slime.jrunscript.runtime.io.Reader
			}
			length?: number
			modified?: any

			/**
			 * If the first argument is is `Streams.binary` or `Streams.text`, this method opens a stream and returns it. If the argument is a
			 * string, this method opens a character stream, writes the string to the stream, and closes the stream. If the value is
			 * a binary or character input stream, this method reads the stream until it is exhausted and copies its contents to the
			 * location of this file, closing the stream after doing so.
			 */
			write?: {
				(marker: slime.jrunscript.runtime.io.Exports["Streams"]["binary"], mode?: resource.WriteMode): slime.jrunscript.runtime.io.OutputStream
				(marker: slime.jrunscript.runtime.io.Exports["Streams"]["text"], mode?: resource.WriteMode): slime.jrunscript.runtime.io.Writer
				(input: slime.jrunscript.runtime.io.InputStream, mode?: resource.WriteMode): void
				(input: slime.jrunscript.runtime.io.Reader, mode?: resource.WriteMode): void
				(input: string, mode?: resource.WriteMode): void
				(input: slime.jrunscript.native.java.util.Properties, mode?: resource.WriteMode): void
			}

			java?: {
				adapt: JA
			}
		}

		export namespace resource {
			export interface Descriptor extends slime.resource.Descriptor {
				read?: slime.resource.ReadInterface & {
					binary?: () => slime.jrunscript.runtime.io.InputStream
					text?: any
				}
				length?: number
				modified?: any
				write?: {
					binary?: (mode: any) => slime.jrunscript.runtime.io.OutputStream
					text?: (mode: any) => slime.jrunscript.runtime.io.Writer
				}
			}

			/**
			 * @deprecated
			 */
			export interface DeprecatedStreamDescriptor extends slime.resource.Descriptor {
				stream?: {
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

			export type HistoricSupportedDescriptor = resource.Descriptor | resource.LoadedDescriptor | slime.resource.Descriptor | DeprecatedStreamDescriptor

			export interface WriteMode {
				/**
				 * What to do if the file already exists. If `true`, this method will append to, rather than overwriting, the file.
				 * If `false`, the file will be overwritten. Otherwise, an exception will be generated if the file exists.
				 */
				append?: boolean

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
		script: any
		setReadOnly: any
		MetaObject: any
		noEnvironmentAccess: any
		eval(a: any, b: any, c: any, d: any): any
	}

	export namespace internal {
		export namespace rhino {
			/**
			 * This is essentially a `Packages.inonit.script.rhino.Engine` instance.
			 */
			export interface Engine {
				script(name: string, code: string, scope: object, target: object)
				canAccessEnvironment(): boolean
				getDebugger(): slime.jrunscript.native.inonit.script.rhino.Engine.Debugger
			}

			/**
			 * An object providing the scope variables for running `loader/jrunscript/rhino.js`.
			 */
			export interface Scope {
				$rhino: Engine
				$loader: slime.jrunscript.native.inonit.script.engine.Loader
			}
		}

		export namespace nashorn {
			/**
			 * A `Packages.inonit.script.jsh.Graal.Host` instance, currently, although this should not depend on `jsh` classes. In any case,
			 * none of its methods are currently used, so this is currently an empty interface.
			 */
			export interface Graal {
			}

			export interface Scope {
				$graal: Graal
				$loader: slime.jrunscript.native.inonit.script.engine.Loader
			}
		}
	}

	export type sync = <F extends (...args: any[]) => any>(f: F, lock: any) => F

	export type MultithreadedJava = Exports["java"] & {
		sync: sync
		thisSynchronize: any
	}

	export interface Rhino extends Exports {
		getDebugger: () => slime.jrunscript.native.inonit.script.rhino.Engine.Debugger
		java: MultithreadedJava
	}

	export interface Nashorn extends Exports {
		java: MultithreadedJava
	}

	export interface Graal extends Exports {
	}

	export interface Java {
		type(className: string): any
	}

	export namespace internal {
		export namespace nashorn {
			export interface load {
				(location: string): void
				(script: { script: string, name: string })
			}

			export interface Engine {
				script: any
				subshell: any
			}

			export interface Nashorn extends Engine {
				sync: any
			}

			export interface Graal extends Engine {
				eval: any
			}
		}
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
			_source: slime.jrunscript.native.inonit.script.engine.Code.Loader
		}

		/** @deprecated */
		export interface DeprecatedResourcesSource {
			child?: any
			resources: any
			Loader?: any
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

	/**
	 * The SLIME runtime, augmented with Java-specific capabilities: a `classpath`, the `jrunscript` `java` and `io` interfaces,
	 * and Java-aware versions of `Resource`, `Loader`, and `mime`.
	 */
	export interface Exports extends slime.runtime.Exports {
		/**
		 * The `jrunscript` implementation enhances the default MIME implementation by using the
		 * `java.net.URLConnection.getFileNameMap()` method as an additional way to guess content types from file names.
		 */
		mime: $api.mime.Export

		Loader: slime.runtime.Exports["old"]["Loader"] & {
			new (p: internal.CustomSource): Loader
		}

		Resource: slime.runtime.Exports["Resource"] & {
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

	/**
	 * A standardized interface for resources that eases interoperability between various kinds of loaders.
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
					java: (_loader: slime.jrunscript.native.inonit.script.engine.Code.Loader) => slime.runtime.loader.Synchronous<slime.jrunscript.native.inonit.script.engine.Code.Loader.Resource>
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

			fifty.tests.exports.loader = function() {
				verify($slime).loader.is.type("object");
				verify($slime).loader.synchronous.is.type("object");
				verify($slime).loader.synchronous.script.is.type("function");

				fifty.load("../Loader.fifty.ts", "script", loader);
				fifty.load("../Loader.fifty.ts", "object", loader);
			}
		}
	//@ts-ignore
	)(Packages,fifty);
}

namespace slime.$api {
	export interface Global {
		jrunscript: {
			Properties: {
				codec: {
					object: slime.Codec<slime.$api.jrunscript.Properties,slime.jrunscript.native.java.util.Properties>
				}
			}
		}
	}

	var jrunscript: Global["jrunscript"]

	export namespace jrunscript {
		export type Properties = { [x: string]: string }
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.$api = {
				jrunscript: function() {
					var values = {
						a: "1"
					};

					var encoded = $api.jrunscript.Properties.codec.object.encode(values);
					jsh.shell.console(String(encoded));
					verify(encoded.getProperty("a")).evaluate(String).is("1");
					verify(encoded.getProperty("foo")).is(null);

					var decoded = $api.jrunscript.Properties.codec.object.decode(encoded);
					verify(decoded).a.is("1");
					verify(decoded).evaluate.property("foo").is(void(0));
				}
			}
		}
	//@ts-ignore
	)(fifty);

}

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		const { verify } = fifty;

		fifty.tests.suite = function() {
			verify(fifty.global.jsh).unit.$slime.$platform.is.type("object");

			fifty.run(fifty.tests.exports);

			fifty.run(fifty.tests.$api.jrunscript);

			//	TODO	redundant? tested per-engine in contributor/suite.jsh.js
			fifty.load("java.fifty.ts");
			fifty.load("io.fifty.ts");
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
}
