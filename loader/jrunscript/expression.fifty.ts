namespace slime.jrunscript.runtime {
	export interface JavaClass {
	}

	export interface Resource extends slime.Resource {
		read: slime.Resource["read"] & {
			binary: () => slime.jrunscript.runtime.io.InputStream
			text: () => slime.jrunscript.runtime.io.Reader
		}
		length?: any
		modified?: any
	}

	export namespace Resource {
		export interface Descriptor extends slime.resource.Descriptor {
			read?: slime.resource.Descriptor["read"] & {
				binary?: any
				text?: any
			}
			stream?: {
				binary: slime.jrunscript.runtime.io.InputStream
			}
			_loaded?: {
				path: string
				resource: slime.jrunscript.native.inonit.script.engine.Code.Loader.Resource
			}
			length?: number
			modified?: any
			write?: any
		}

	}

	export namespace Loader {
		export interface Source extends slime.loader.Source {
			zip: any
			_source: any
			_file: any
			_url: any
			/** @deprecated */
			resources: any
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

	export interface Exports extends slime.runtime.Exports {
		Loader: any

		Resource: {
			new (p: Resource.Descriptor): Resource
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

namespace slime.jrunscript {
	export namespace native {
		//	TODO	convert Packages to interface by moving these into interface and declaring Packages explicitly everywhere it is
		//			used in the code; should write issue and remove this comment

		export namespace java {
			export namespace lang {
				export interface String {
				}

				export interface Class {
					isInstance(object: any): boolean
				}
			}
			export namespace io {
				export interface InputStream {
					read(): any
					getClass(): any
				}
				export interface OutputStream {
					close()
				}
				export interface Reader {
				}
				export interface Writer {
				}
				export interface PrintStream extends OutputStream {
				}
				export interface File {
					exists(): boolean
					isDirectory(): boolean
					toPath(): slime.jrunscript.native.java.nio.file.Path
					getName(): slime.jrunscript.native.java.lang.String
					getCanonicalPath(): slime.jrunscript.native.java.lang.String
					listFiles(): slime.jrunscript.native.java.io.File[]
					getAbsolutePath(): slime.jrunscript.native.java.lang.String
				}
			}
			export namespace nio {
				export namespace file {
					export interface Path {
					}
				}
			}
			export namespace net {
				export interface ServerSocket {
					getLocalPort(): number
					close()
				}
			}
			export namespace util {
				export interface Properties {
					get(name: string): any
					propertyNames(): any
					getProperty(name: string): string
					keySet(): any
				}

				export interface Date {
					getTime(): number
				}

				export interface Iterator {
					hasNext(): boolean
					next(): any
				}

				export interface Set {
					iterator(): Iterator
				}

				export interface Map {
					keySet(): Set
					get(key: any): any
				}
			}
		}

		type EngineSpecificJshInterface = slime.jsh.plugin.EngineSpecific;

		export namespace inonit.script {
			export namespace runtime.io {
				export interface Streams {
					split: any
					readBytes: any
					copy: any
					readLine: any
				}
			}

			export namespace engine {
				export namespace Code {
					export interface Loader {
						getFile(path: string): Loader.Resource
					}

					export namespace Loader {
						export interface Resource {
							getInputStream(): slime.jrunscript.native.java.io.InputStream
							getLength(): {
								longValue(): number
							}
							getSourceName(): slime.jrunscript.native.java.lang.String
							getLastModified(): slime.jrunscript.native.java.util.Date
						}
					}
				}

				export interface Loader {
					getCoffeeScript()
					getTypescript()
					getClasspath(): any
					getLoaderCode(path: string): any
				}
			}

			export namespace rhino {
				export namespace Engine {
					export interface Debugger {
					}
				}
			}

			//	TODO	move to appropriate directory
			export namespace jsh {
				export interface Shell {
					setRuntime(value: slime.jrunscript.runtime.Exports)
					runtime(): slime.jrunscript.runtime.Exports & EngineSpecificJshInterface
					getLoader(): slime.jrunscript.native.inonit.script.engine.Loader
					getEnvironment(): Shell.Environment
					getInvocation(): Shell.Invocation
					getJshLoader: any
					getInterface(): any
					getLibrary(path: string): any
					getLibraryFile(path: string): slime.jrunscript.native.java.io.File
					getPackaged(): Shell.Packaged

					worker: any
					events: any
				}

				export namespace Shell {
					/**
					 * Methods related to packaged applications, currently used to provide access to packaged application resources
					 * and location so that they can be provided by the <code>jsh.script</code> API.
					 */
					export interface Packaged {
						getFile(): slime.jrunscript.native.java.io.File
						getCode(): slime.jrunscript.native.inonit.script.engine.Code.Loader
					}

					export interface Environment {
						getStdio(): Environment.Stdio
						getEnvironment(): slime.jrunscript.native.inonit.system.OperatingSystem.Environment
						getSystemProperties(): slime.jrunscript.native.java.util.Properties
					}

					export namespace Environment {
						export interface Stdio {
							getStandardInput(): slime.jrunscript.native.java.io.InputStream
							getStandardOutput(): slime.jrunscript.native.java.io.OutputStream
							getStandardError(): slime.jrunscript.native.java.io.OutputStream
						}
					}

					export interface Invocation {
						getScript: any
						getArguments(): slime.jrunscript.native.java.lang.String[]
					}
				}

				export namespace Rhino {
					export interface Interface {
						script: any
						exit: any
						jsh: any
					}
				}
			}
		}
	}

	export interface Packages {
		java: {
			lang: {
				System: {
					err: {
						println: any
					}
					currentTimeMillis(): number
					setProperty(name: string, value: string)
					getProperty(name: string): slime.jrunscript.native.java.lang.String
					getProperties(): any
					exit(status: number)
					getenv(name: string): string
					getenv(): any
					identityHashCode(o: any): number
				}
				reflect: {
					Field: any
					Modifier: any
					Array: any
				}
				String: any
				Thread: any
				Runnable: any
				ClassLoader: any
				Boolean: any
				Object: any
				Class: any
				Void: any
				Runtime: any
			}
			io: {
				ByteArrayInputStream: any
				ByteArrayOutputStream: any
				File: any
				InputStream: any
				StringReader: any
				StringWriter: any
				PrintWriter: any
				Reader: any
				Writer: any
				OutputStream: any
				FileInputStream: any
				PrintStream: {
					new (stream: slime.jrunscript.native.java.io.OutputStream): slime.jrunscript.native.java.io.PrintStream
				}
			},
			net: {
				URLConnection: any
				URI: any
				URL: any
				URLEncoder: any
				URLDecoder: any
				HttpURLConnection: any
				CookieManager: any
				CookiePolicy: any
				Proxy: any
				InetSocketAddress: any
				ServerSocket: new (n: number) => slime.jrunscript.native.java.net.ServerSocket
				Socket: any
			}
			nio: {
				file: {
					Files: any
					attribute: {
						FileTime: any
					}
				}
			}
			util: {
				HashMap: any
				ArrayList: any
				Properties: any
				logging: any
				Base64: any
				Map: any
			}
			awt: {
				Desktop: any
			}
			sql: {
				Types: any
			}
		}
		javax: any
		javafx: any
		jdk: any
		org: {
			mozilla: {
				javascript: {
					Context: any
					Synchronizer: any
				}
			}
			apache: any
			graalvm: any
			jetbrains: any
		}
		inonit: {
			script: {
				runtime: {
					io: {
						Streams: any
					}
					Throwables: any
					Threads: any
				}
				engine: {
					Code: {
						Loader: any
					}
				}
				rhino: {
					Objects: any
					MetaObject: any
					Engine: {
						Log: any
					}
				}
				jsh: {
					Shell: any
				}
				servlet: {
					Servlet: any
				}
			}
			system: slime.jrunscript.native.inonit.system
		}
	}
}

(
	function(
		fifty: slime.fifty.test.kit,
		$slime: slime.jrunscript.runtime.Exports,
		$api: slime.$api.Global,
		$loader: slime.fifty.test.$loader,
		verify: slime.fifty.test.verify,
		tests: slime.fifty.test.tests,
		run: slime.fifty.test.run
	) {
		tests.exports = {};
		tests.exports.Resource = function() {
			var file: slime.jrunscript.runtime.Resource.Descriptor = $loader.source.get("expression.fifty.ts");
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
			verify(encoded).getProperty("a").evaluate(String).is("1");
			verify(encoded).getProperty("foo").is(null);

			var decoded = $api.jrunscript.Properties.codec.object.decode(encoded);
			verify(decoded).a.is("1");
			verify(decoded).evaluate.property("foo").is(void(0));

			run(tests.exports.Resource);
		}
	}
//@ts-ignore
)(fifty, jsh.unit["$slime"], $api, $loader, verify, tests, run);
