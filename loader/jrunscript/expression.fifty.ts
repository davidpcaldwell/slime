//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

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
			read?: slime.resource.Descriptor["read"] & {
				binary?: () => slime.jrunscript.runtime.io.InputStream
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
			write?: {
				binary?: any
				text?: any
			}
		}

		export interface WriteMode {
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
		/**
		 * The `jrunscript` implementation enhances the default MIME implementation by using the
		 * `java.net.URLConnection.getFileNameMap()` method as an additional way to guess content types from file names.
		 */
		mime: slime.runtime.Exports["mime"]

		Loader: slime.runtime.Exports["Loader"] & {
			new (p: { zip: { _file: any }}): any
			new (p: { zip: { resource: any }}): any
			new (p: { _file: any }): any
			new (p: { _source: any }): any
			new (p: { resources: any, Loader?: any }): any
		}

		Resource: {
			new (p: resource.Descriptor): Resource
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
					equals(other: any): boolean
				}

				export interface Class {
					isInstance(object: any): boolean
				}
			}
			export namespace io {
				export interface InputStream {
					read(): any
					getClass(): any
					close()
				}
				export interface OutputStream {
					write(b: number)
					close()
				}
				export interface Reader {
					close()
				}
				export interface Writer {
					write(string: string)
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
					renameTo(file: File)
					getParentFile(): File
					getAbsoluteFile(): File
					toURI(): net.URI
					mkdirs()
					isAbsolute(): boolean
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

				export interface URI {
					toURL(): URL
				}

				export interface URLConnection {
					setRequestMethod(method: string)
					setConnectTimeout(x: any)
					setReadTimeout(x: any)
					addRequestProperty(name: string, value: string)
					setRequestProperty(name: string, value: string)
					setInstanceFollowRedirects(b: boolean)
					setDoOutput(b: boolean)
					getInputStream(): slime.jrunscript.native.java.io.InputStream
					getErrorStream(): slime.jrunscript.native.java.io.InputStream
					getOutputStream(): slime.jrunscript.native.java.io.OutputStream
					getResponseCode(): number
					getResponseMessage(): slime.jrunscript.native.java.lang.String
					getHeaderFieldKey(i: number): slime.jrunscript.native.java.lang.String
					getHeaderField(i: number): slime.jrunscript.native.java.lang.String
				}

				export interface URL {
					getQuery(): slime.jrunscript.native.java.lang.String
					getProtocol(): slime.jrunscript.native.java.lang.String
					toExternalForm(): slime.jrunscript.native.java.lang.String
					toURI(): slime.jrunscript.native.java.net.URI
					openConnection: {
						(): slime.jrunscript.native.java.net.URLConnection
						(proxy: slime.jrunscript.native.java.net.Proxy): slime.jrunscript.native.java.net.URLConnection
					}
					openStream(): slime.jrunscript.native.java.io.InputStream
					getHost(): slime.jrunscript.native.java.lang.String
					getPath(): slime.jrunscript.native.java.lang.String
				}

				export interface Proxy {
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
					copy: {
						(i: slime.jrunscript.native.java.io.InputStream, o: slime.jrunscript.native.java.io.OutputStream, closeInputStream?: boolean): void
						(r: slime.jrunscript.native.java.io.Reader, w: slime.jrunscript.native.java.io.Writer): void
					}
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

				export namespace Loader {
					export namespace Classes {
						export interface Interface {}
					}
				}
			}

			//	TODO	move this to where these classes actually are
			export namespace servlet {
				export namespace Servlet {
					export interface Script {
					}
				}

				export interface Servlet {
					getServletConfig(): any
					getServletContext(): any
				}
			}

			export namespace rhino {
				export namespace Engine {
					export interface Debugger {
					}

					export interface Loader {
						getLoaderCode(path: string): any
					}
				}

				export interface Engine {
					script: (a: any, b: any, c: any, d: any) => any
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
					out: {
						print: any
						println: any
					}
					console: () => any
					currentTimeMillis(): number
					setProperty(name: string, value: string)
					getProperty(name: string): slime.jrunscript.native.java.lang.String
					getProperties(): slime.jrunscript.native.java.util.Properties
					exit(status: number)
					getenv(name: string): string
					getenv(): any
					identityHashCode(o: any): number
				}
				Throwable: any
				reflect: {
					Field: any
					Modifier: any
					Array: any
				}
				String: any
				Character: any
				Thread: any
				Runnable: any
				ClassLoader: any
				Boolean: any
				Object: any
				Class: any
				Void: any
				Runtime: any
				Integer: any
				RuntimeException: any
				ProcessBuilder: any
				StringBuilder: any
			}
			io: {
				ByteArrayInputStream: any
				ByteArrayOutputStream: any
				File: {
					new (parent: slime.jrunscript.native.java.io.File, path: string): slime.jrunscript.native.java.io.File
					new (parent: string, path: string): slime.jrunscript.native.java.io.File
					new (path: slime.jrunscript.native.java.lang.String): slime.jrunscript.native.java.io.File
					new (path: string): slime.jrunscript.native.java.io.File
					new (uri: slime.jrunscript.native.java.net.URI): slime.jrunscript.native.java.io.File

					separator: slime.jrunscript.native.java.lang.String
					pathSeparator: slime.jrunscript.native.java.lang.String
					createTempFile: any
				}
				InputStream: any
				StringReader: any
				StringWriter: any
				PrintWriter: any
				Reader: any
				Writer: any
				OutputStream: any
				FileInputStream: any
				FileReader: any
				InputStreamReader: any
				OutputStreamWriter: any
				FileOutputStream: any
				FileWriter: any
				PrintStream: {
					new (stream: slime.jrunscript.native.java.io.OutputStream): slime.jrunscript.native.java.io.PrintStream
				}
			},
			net: {
				URLConnection: any
				URI: any
				URL: {
					new (base: slime.jrunscript.native.java.net.URL, relative: string): slime.jrunscript.native.java.net.URL
					new (url: string): slime.jrunscript.native.java.net.URL
				}
				URLEncoder: any
				URLDecoder: any
				URLClassLoader: any
				HttpURLConnection: any
				CookieManager: any
				CookiePolicy: any
				CookieHandler: any
				Proxy: {
					new (x: any, y: any): slime.jrunscript.native.java.net.Proxy
					Type: {
						SOCKS: any
						HTTP: any
					}
				}
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
					LinkOption: any
				}
				charset: {
					Charset: any
				}
			}
			util: {
				HashMap: any
				ArrayList: any
				Properties: any
				logging: any
				Base64: any
				Map: any
				zip: any
				jar: any
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
					WrappedException: any
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
					launcher: any
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
		run: slime.fifty.test.kit["run"]
	) {
		tests.exports = {};
		tests.exports.Resource = function() {
			var file: slime.jrunscript.runtime.resource.Descriptor = $loader.source.get("expression.fifty.ts");
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
