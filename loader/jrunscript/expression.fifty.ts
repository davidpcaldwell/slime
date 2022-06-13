//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime {
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
				binary?: any
				text?: any
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
		export interface Source extends slime.loader.Source {
			_source?: slime.jrunscript.native.inonit.script.engine.Code.Loader
			zip?: any
			_file?: any
			_url?: any
			/** @deprecated */
			resources?: any
		}
	}

	export interface Loader extends slime.Loader {
		java: {
			adapt: () => slime.jrunscript.native.inonit.script.engine.Code.Loader
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

		Loader: slime.runtime.Exports["Loader"] & {
			new (p: { zip: { _file: any }}): any
			new (p: { zip: { resource: any }}): any
			new (p: { _file: any }): any
			new (p: { _source: slime.jrunscript.native.inonit.script.engine.Code.Loader }): Loader
			new (p: { resources: any, Loader?: any }): any
		}

		Resource: slime.runtime.Exports["Resource"] & {
			new (p: resource.HistoricSupportedDescriptor): Resource
		}

		io: slime.jrunscript.runtime.io.Exports
		java: slime.jrunscript.runtime.java.Exports
		classpath: any
	}
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
}

(
	function(
		fifty: slime.fifty.test.Kit,
		$slime: slime.jrunscript.runtime.Exports,
		$api: slime.$api.Global,
		$loader: slime.Loader,
		verify: slime.fifty.test.verify,
		tests: slime.fifty.test.tests,
		run: slime.fifty.test.Kit["run"]
	) {
		tests.exports = {};
		tests.exports.Resource = function() {
			var file: slime.jrunscript.runtime.resource.Descriptor = $loader.source.get("expression.fifty.ts") as slime.jrunscript.runtime.resource.Descriptor;
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

		tests.suite = function() {
			verify($slime).$platform.is.type("object");

			const jsh = fifty.global.jsh;

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

			run(tests.exports.Resource);
		}
	}
//@ts-ignore
)(fifty, jsh.unit["$slime"], $api, $loader, verify, tests, run);
