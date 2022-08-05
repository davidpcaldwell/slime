//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript {
	export interface Array<T = native.java.lang.Object> {
		[i: number]: T
		readonly length: number
	}

	export namespace native {
		//	TODO	convert Packages to interface by moving these into interface and declaring Packages explicitly everywhere it is
		//			used in the code; should write issue and remove this comment

		export namespace java {
			export namespace lang {
				export interface Object {
				}

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
					write: (string: string) => void
					flush: () => void
					close: () => void
				}
				export interface PrintStream extends OutputStream {
				}
				export interface FilenameFilter {
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
					toURL(): net.URL
					mkdirs()
					isAbsolute(): boolean
					lastModified(): number
					setLastModified(time: number)
				}
			}
			export namespace nio {
				export namespace file {
					export interface Path {
						getFileSystem(): FileSystem
					}

					export interface FileSystem {
						supportedFileAttributeViews(): slime.jrunscript.native.java.util.Set
					}
				}

				export namespace charset {
					export interface Charset {
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
				export interface List<T = native.java.lang.Object> {
				}

				export interface Properties {
					get(name: string): any
					propertyNames(): any
					getProperty(name: string): string
					keySet(): any
				}

				export interface Enumeration<T> {
					hasMoreElements(): boolean
					nextElement(): T
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
					contains(element: any): boolean
				}

				export interface Map {
					keySet(): Set
					get(key: any): any
				}
			}
			export namespace awt {
				export interface Desktop {
					browse: (uri: slime.jrunscript.native.java.net.URI) => void
				}
			}
		}

		export namespace javax.mail {
			export namespace internet {
				export interface MimeMultipart {
				}
			}
		}

		export namespace org {
			export namespace openqa {
				export namespace selenium {
					export interface Capabilities {
					}
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
						getEnumerator(): Code.Loader.Enumerator
						child(path: string): Loader
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

						export interface Enumerator {
							list(prefix: string): slime.jrunscript.native.java.lang.String[]
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
						export interface Interface {
							setAsThreadContextClassLoaderFor: (_thread: any) => void
							getClass: (name: any) => any
							add: (argument: any) => void
							addJar: (argument: any) => void
							compiling: (argument: any) => any
						}
					}
				}
			}

			//	TODO	move this to where these classes actually are
			export namespace servlet {
				export namespace Servlet {
					export interface Script {
						service: (_request: any, _response: any) => void
						destroy: () => void
					}
				}

				export interface Servlet {
					getServletConfig(): {
						getServletContext(): {
							getResource(path: string): slime.jrunscript.native.java.net.URL
							getMimeType(file: string): slime.jrunscript.native.java.lang.String
						}

						getInitParameter: {
							(name: string): slime.jrunscript.native.java.lang.String
							(name: slime.jrunscript.native.java.lang.String): slime.jrunscript.native.java.lang.String
						}

						getInitParameterNames(): slime.jrunscript.native.java.util.Enumeration<slime.jrunscript.native.java.lang.String>
					}
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

	export type JavaClass = any

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
					exit(status: number): never
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
				Byte: JavaClass
				Number: JavaClass
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
			}
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
				InetAddress: any
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
					StandardCharsets: any
				}
			}
			util: {
				HashMap: any
				ArrayList: any
				Properties: any
				logging: any
				Base64: any
				Map: any
				Date: any
				zip: any
				jar: any
				UUID: any
			}
			text: {
				SimpleDateFormat: any
			}
			security: {
				KeyStore: any
				SecureRandom: any
			}
			awt: {
				Desktop: {
					isDesktopSupported: () => boolean
					getDesktop: () => slime.jrunscript.native.java.awt.Desktop
				}
				event: {
					WindowListener: any
				}
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
			openqa: any
		}
		inonit: {
			script: {
				runtime: {
					io: {
						Streams: any
						Filesystem: {
							create: () => slime.jrunscript.native.inonit.script.runtime.io.Filesystem
							Optimizations: any
						}
					}
					Throwables: any
					Threads: any
				}
				engine: {
					Code: {
						Loader: {
							create: (url: slime.jrunscript.native.java.net.URL) => slime.jrunscript.native.inonit.script.engine.Code.Loader

							github: any
							Resource: any
							URI: any
							zip: (p: any) => slime.jrunscript.native.inonit.script.engine.Code.Loader
						}
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
			tools: {
				Profiler: any
			}
		}
	}
}
