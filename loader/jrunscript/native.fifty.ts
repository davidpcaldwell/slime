//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript {
	export interface Array<T = native.java.lang.Object> extends slime.jrunscript.native.java.lang.Object {
		[i: number]: T
		readonly length: number
	}

	export namespace native {
		//	TODO	convert Packages to interface by moving these into interface and declaring Packages explicitly everywhere it is
		//			used in the code; should write issue and remove this comment

		export namespace java {
			export namespace lang {
				export interface Object {
					getClass(): Class
				}

				export interface String extends Object {
					equals(other: any): boolean
					toCharArray(): any
					getBytes(): any
				}

				export interface Class {
					isInstance(object: any): boolean
					getDeclaredField(name: string): reflect.Field
					getDeclaredMethod(name: string, types?: slime.jrunscript.native.java.lang.Class[]): reflect.Method
					getMethod(name: string): reflect.Method
				}

				export interface ClassLoader {
					loadClass: (name: string) => slime.jrunscript.native.java.lang.Class
				}

				export interface Runnable {
				}

				export interface Thread {
				}

				export namespace reflect {
					export interface Field {
						setAccessible(flag: boolean): void
						setInt(object: object, i: number)
						getModifiers(): number
						get(object: Object): Object
						set(obj: Object, value: Object): void
					}

					export interface Method {
						setAccessible(flag: boolean): void
						getReturnType(): slime.jrunscript.native.java.lang.Class
						invoke: (target: slime.jrunscript.native.java.lang.Object, parameters: slime.jrunscript.native.java.lang.Object[]) => slime.jrunscript.native.java.lang.Object
					}
				}
			}
			export namespace io {
				export interface InputStream {
					read(): any
					getClass(): any
					close()
				}
				export interface ByteArrayInputStream extends InputStream {
				}
				export interface OutputStream {
					write(b: number)
					close()
				}
				export interface ByteArrayOutputStream extends OutputStream {
					toByteArray: () => any
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
					println: (line: string) => void
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
					length(): number
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

					export namespace attribute {
						export interface PosixFilePermission {
						}

						export interface PosixFileAttributes {
							owner: () => slime.jrunscript.native.java.security.Principal
							group: () => slime.jrunscript.native.java.security.Principal
							permissions: () => slime.jrunscript.native.java.util.Set<slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission>
						}
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

			export namespace security {
				export interface Principal {
					getName: () => slime.jrunscript.native.java.lang.String
				}
			}

			export namespace util {
				export interface List<T = native.java.lang.Object> {
				}

				export interface Random extends native.java.lang.Object {
					nextDouble(): number
				}

				export interface Properties extends native.java.lang.Object {
					load(value: any): void
					get(name: string): any
					propertyNames(): any
					getProperty(name: string): string
					setProperty(name: string, value: string): void
					keySet(): any
					entrySet(): any
					store: (out: slime.jrunscript.native.java.io.OutputStream, comments: string) => void
				}

				export interface Enumeration<T> {
					hasMoreElements(): boolean
					nextElement(): T
				}

				export interface Date {
					getTime(): number
				}

				export interface Iterator<T = any> {
					hasNext(): boolean
					next(): T
				}

				export interface Set<T = slime.jrunscript.native.java.lang.Object> {
					iterator(): Iterator<T>
					contains(element: any): boolean
				}

				export interface Map<K = slime.jrunscript.native.java.lang.Object, V = slime.jrunscript.native.java.lang.Object> extends java.lang.Object {
					keySet(): Set<K>
					entrySet(): Set<Map.Entry<K,V>>
					get(key: K): V
				}

				export namespace Map {
					export interface Entry<K,V> {
						getKey: () => K
						getValue: () => V
					}
				}

				export namespace logging {
					export interface Logger extends java.lang.Object {
						log: {
							(_level: Level, message: string): void
							(_level: Level, message: string, objects: any): void
						}
						isLoggable: (_traceLevel: Level) => boolean
					}

					export interface Level extends java.lang.Object {
					}
				}

				export namespace stream {
					export interface Stream<T> extends slime.jrunscript.native.java.lang.Object {
						iterator: () => Iterator<T>
					}
				}

				export namespace zip {
					export interface ZipEntry extends slime.jrunscript.native.java.lang.Object {
						getName: () => slime.jrunscript.native.java.lang.String
						isDirectory: () => boolean
					}
				}

				export namespace jar {
					export interface JarEntry extends slime.jrunscript.native.java.util.zip.ZipEntry {

					}

					export interface JarFile extends slime.jrunscript.native.java.lang.Object {
						getManifest: () => Manifest
						entries: () => any
						stream: () => slime.jrunscript.native.java.util.stream.Stream<JarEntry>
						getInputStream: (ze: any) => slime.jrunscript.native.java.io.InputStream
					}

					export interface Manifest extends slime.jrunscript.native.java.lang.Object {
						getMainAttributes: () => Attributes
						getEntries: () => slime.jrunscript.native.java.util.Map<slime.jrunscript.native.java.lang.String,Attributes>
						read: (_input: slime.jrunscript.native.java.io.InputStream) => void
					}

					export interface Attributes extends slime.jrunscript.native.java.util.Map {
					}
				}
			}

			export namespace math {
				export interface BigDecimal extends slime.jrunscript.native.java.lang.Object {
				}

				export interface MathContext extends slime.jrunscript.native.java.lang.Object {
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

		export namespace javax.tools {
			export interface DiagnosticListener {}
			export interface JavaFileManager extends java.lang.Object {}
		}

		export namespace org {
			export namespace openqa {
				export namespace selenium {
					export interface Capabilities {
					}
				}
			}
		}

		export namespace inonit.script {
			export namespace engine {
				export namespace Code {
					export interface Loader extends java.lang.Object {
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
				export interface Debugger {
					isBreakOnExceptions: () => boolean
					setBreakOnExceptions: (b: boolean) => void
				}

				export namespace Engine {
					export interface Loader {
						getLoaderCode(path: string): any
					}
				}

				export interface Engine {
					script: (name: string, code: string, scope: object, target: object) => any
					canAccessEnvironment: () => boolean
					getDebugger: () => slime.jrunscript.native.inonit.script.rhino.Debugger
				}
			}
		}
	}

	export type JavaClass<
		O extends slime.jrunscript.native.java.lang.Object = slime.jrunscript.native.java.lang.Object,
		C = {}
	> = {
		new (...args: any[]): O
	} & C

	declare const propertiesTag: unique symbol;

	export type PropertiesJavaClass = JavaClass<slime.jrunscript.native.java.util.Properties> & {
		[propertiesTag]: "value"
	}

	export interface Packages {
		java: {
			lang: {
				System: JavaClass & {
					err: slime.jrunscript.native.java.io.PrintStream
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

					gc(): void
				}
				Math: JavaClass<slime.jrunscript.native.java.lang.Object,{
					random(): number
				}>,
				Throwable: any
				reflect: {
					Field: any
					Modifier: any
					Array: any
				}
				String: {
					new (string: string): slime.jrunscript.native.java.lang.String
					format: any
				}
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
				Byte: JavaClass & {
					TYPE: any
				}
				Number: JavaClass
			}
			io: {
				ByteArrayInputStream: new (bytes: any) => slime.jrunscript.native.java.io.ByteArrayInputStream
				ByteArrayOutputStream: new () => slime.jrunscript.native.java.io.ByteArrayOutputStream
				File: JavaClass & {
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
				URLConnection: {
					getFileNameMap: () => {
						getContentTypeFor: (fileName: string) => string
					}
				}
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
			math: {
				BigDecimal: JavaClass<slime.jrunscript.native.java.math.BigDecimal>
				MathContext: JavaClass<slime.jrunscript.native.java.math.MathContext,{
					UNLIMITED: slime.jrunscript.native.java.math.MathContext
				}>
				RoundingMode: JavaClass<slime.jrunscript.native.java.lang.Object, {
					HALF_EVEN: slime.jrunscript.native.java.lang.Object
				}>
			}
			nio: {
				file: {
					Files: any
					FileSystems: any
					attribute: {
						FileTime: any
						PosixFilePermission: {
							OWNER_READ: slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission
							OWNER_WRITE: slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission
							OWNER_EXECUTE: slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission
							GROUP_READ: slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission
							GROUP_WRITE: slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission
							GROUP_EXECUTE: slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission
							OTHERS_READ: slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission
							OTHERS_WRITE: slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission
							OTHERS_EXECUTE: slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission
						}
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
				HashSet: any
				ArrayList: any
				Properties: PropertiesJavaClass
				logging: {
					Logger: JavaClass<
						slime.jrunscript.native.java.util.logging.Logger,
						{
							getLogger: (name: string) => slime.jrunscript.native.java.util.logging.Logger
						}
					>
					Level: JavaClass<
						slime.jrunscript.native.java.util.logging.Level,
						{
							SEVERE: slime.jrunscript.native.java.util.logging.Level
							WARNING: slime.jrunscript.native.java.util.logging.Level
							INFO: slime.jrunscript.native.java.util.logging.Level
							CONFIG: slime.jrunscript.native.java.util.logging.Level
							FINE: slime.jrunscript.native.java.util.logging.Level
							FINER: slime.jrunscript.native.java.util.logging.Level
							FINEST: slime.jrunscript.native.java.util.logging.Level
						}
					>
					LogManager: any
					Handler: any
				}
				Base64: any
				Map: any
				Date: any
				zip: any
				jar: {
					JarFile: JavaClass<slime.jrunscript.native.java.util.jar.JarFile>
					Manifest: JavaClass<slime.jrunscript.native.java.util.jar.Manifest>
				}
				UUID: any
				TimeZone: any
				Calendar: any
				Random: JavaClass<slime.jrunscript.native.java.util.Random>
				spi: any
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
					KeyListener: any
					KeyEvent: any
				}
				BorderLayout: any
				datatransfer: {
					StringSelection: any
				}
				Toolkit: any
			}
			sql: {
				Types: any
			}
		}
		javax: any
		javafx: any
		org: {
			openjdk: {
				nashorn: Packages["jdk"]["nashorn"]
			}
			mozilla: {
				javascript: {
					Context: slime.jrunscript.JavaClass<slime.jrunscript.native.org.mozilla.javascript.Context,{
						getCurrentContext: () => slime.jrunscript.native.org.mozilla.javascript.Context
					}>
					Synchronizer: any
					WrappedException: any
				}
			}
			apache: any
			graalvm: any
			jetbrains: any
			openqa: any
			w3c: any
			xml: any
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
						Loader: JavaClass<
							slime.jrunscript.native.inonit.script.engine.Code.Loader,
							{
								create: {
									(url: slime.jrunscript.native.java.net.URL): slime.jrunscript.native.inonit.script.engine.Code.Loader
									(file: slime.jrunscript.native.java.io.File): slime.jrunscript.native.inonit.script.engine.Code.Loader
								}

								github: any
								Resource: any
								URI: any
								zip: {
									(p: slime.jrunscript.native.java.io.File): slime.jrunscript.native.inonit.script.engine.Code.Loader
									(p: slime.jrunscript.native.inonit.script.engine.Code.Loader.Resource): slime.jrunscript.native.inonit.script.engine.Code.Loader
								}
							}
						>
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
			system: {
				OperatingSystem: {
					Environment: JavaClass<slime.jrunscript.native.inonit.system.OperatingSystem.Environment,{
						SYSTEM: slime.jrunscript.native.inonit.system.OperatingSystem.Environment
						create: any
					}>
					get: () => slime.jrunscript.native.inonit.system.OperatingSystem
				}
				Command: {
					Context: any
					Configuration: any
				}
				Logging: any
				Subprocess: any
			}
			tools: {
				Profiler: any
			}
		}
	}
}
