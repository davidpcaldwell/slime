//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime {
	export namespace old {
		export interface Resource extends slime.Resource {
			read: slime.Resource["read"] & {
				binary: () => slime.jrunscript.runtime.io.InputStream
				text: () => slime.jrunscript.runtime.io.Reader
			}
			length?: number
			modified?: any

			write?: {
				(marker: slime.jrunscript.runtime.io.Exports["Streams"]["binary"], mode?: resource.WriteMode): slime.jrunscript.runtime.io.OutputStream
				(marker: slime.jrunscript.runtime.io.Exports["Streams"]["text"], mode?: resource.WriteMode): slime.jrunscript.runtime.io.Writer
				(input: slime.jrunscript.runtime.io.InputStream, mode?: resource.WriteMode): void
				(input: slime.jrunscript.runtime.io.Reader, mode?: resource.WriteMode): void
				(input: string, mode?: resource.WriteMode): void
				(input: slime.jrunscript.native.java.util.Properties, mode?: resource.WriteMode): void
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

	export namespace rhino {
		/**
		 * An object providing the scope variables for running `loader/jrunscript/rhino.js`.
		 */
		export interface Scope {
			$rhino: Engine
			$loader: slime.jrunscript.native.inonit.script.engine.Loader
		}

		/**
		 * This is essentially a `Packages.inonit.script.rhino.Engine` instance.
		 */
		export interface Engine {
			script(name: string, code: string, scope: object, target: object)
			canAccessEnvironment(): boolean
			getDebugger(): slime.jrunscript.native.inonit.script.rhino.Engine.Debugger
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

	export type sync = any

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
		classpath: any
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

			var modifiedOrder: slime.$api.fp.Ordering<loader.Entry> = function(entry) {
				return function(other) {
					var m1 = entry.resource.modified();
					var m2 = other.resource.modified();
					if (!m1.present && !m2.present) return "EQUAL";
					if (!m1.present) return "BEFORE";
					if (!m2.present) return "AFTER";
					var eTime = m1.value;
					var oTime = m2.value;
					if (oTime < eTime) return "AFTER";
					if (oTime > eTime) return "BEFORE";
					return "EQUAL";
				}
			};

			var getLastModified: (loader: slime.runtime.loader.Synchronous<slime.jrunscript.native.inonit.script.engine.Code.Loader.Resource>) => slime.$api.fp.Maybe<number> = $api.Function.pipe(
				$api.Function.split({
					listing: $slime.loader.synchronous.resources({
						resource: function(path, name) {
							return true;
						},
						parent: function(path) {
							if (path.length == 1 && path[0] == ".git") return false;
							if (path.length == 1 && path[0] == "local") return false;
							if (path.length == 1 && path[0] == "bin") return false;
							return true;
						}
					}),
					loader: $api.Function.identity
				}),
				function(inputs) {
					return inputs.listing.map(
						$slime.jrunscript.entry.Loader.from.synchronous({
							loader: inputs.loader,
							map: $slime.jrunscript.Resource.from.java
						})
					);
				},
				$api.Function.Array.first(modifiedOrder),
				$api.Function.Maybe.map(function(latest) {
					jsh.shell.console("latest = " + ((latest.path.length) ? latest.path.join("/") + "/" : "") + latest.name);
					return latest.resource.modified();
				}),
				function(it) {
					if (it.present) return it.value;
					return $api.Function.Maybe.nothing();
				}
			)

			fifty.tests.wip = $api.Function.pipe(
				$api.Function.impure.Input.value(loader),
				getLastModified,
				function(it) {
					if (it.present) {
						jsh.shell.console("Modified: " + it.value);
						// jsh.shell.console("Latest: " + ( (it.value.path.length) ? it.value.path.join("/") + "/" : "" ) + it.value.name + " at " + JSON.stringify(it.value.resource.modified()));
					} else {
						jsh.shell.console("Error.");
					}
				}
			);
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
