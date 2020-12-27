namespace slime.jrunscript.runtime {
	export interface Resource extends slime.Resource {
		read: slime.Resource["read"] & {
			binary: () => slime.jrunscript.runtime.io.InputStream
			text: () => slime.jrunscript.runtime.io.Reader
		}
		length?: any
		modified?: any
		string?: any
	}

	export namespace Resource {
		export interface Descriptor extends slime.Resource.Descriptor {
			read?: slime.Resource.Descriptor["read"] & {
				binary?: any
				text?: any
			}
			stream?: {
				binary: slime.jrunscript.runtime.io.InputStream
			}
			_loaded?: {
				path: string
				resource: Packages.inonit.script.engine.Code.Loader.Resource
			}
			length?: number
			modified?: any
			write?: any
		}

	}

	export namespace Loader {
		export interface Source extends slime.Loader.Source {
			zip: any
			_source: any
			_file: any
			_url: any
			/** @deprecated */
			resources: any
		}
	}

	export interface Exports extends slime.runtime.Exports {
		Loader: any

		Resource: {
			new (p: Resource.Descriptor): Resource
		}

		io: slime.jrunscript.runtime.io.Exports
		java: any
		classpath: any
	}
}

interface $api {
	jrunscript: {
		Properties: {
			codec: {
				object: slime.Codec<$api.jrunscript.Properties,Packages.java.util.Properties>
			}
		}
	}
}

namespace $api {
	var jrunscript: $api["jrunscript"]

	export namespace jrunscript {
		export type Properties = { [x: string]: string }
	}
}

interface Packages {
	java: {
		lang: {
			System: {
				err: {
					println: any
				}
				setProperty(name: string, value: string)
				getProperty(name: string): Packages.java.lang.String
				exit(status: number)
			}
			reflect: {
				Field: any
				Modifier: any
			}
			String: any
			Thread: any
		}
		io: {
			ByteArrayInputStream: any
			ByteArrayOutputStream: any
			File: any
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
		}
		awt: {
			Desktop: any
		}
	}
	javax: any
}

namespace Packages {
	//	TODO	convert Packages to interface by moving these into interface and declaring Packages explicitly everywhere it is
	//			used in the code; should write issue and remove this comment

	export namespace java {
		export namespace lang {
			export interface String {
			}
		}
		export namespace io {
			export interface InputStream {
			}
		}
		export namespace util {
			export interface Properties {
				propertyNames(): any
				getProperty(name: string): string
			}

			export interface Date {
				getTime(): number
			}
		}
	}

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
				interface Loader {
					getFile(path: string): Loader.Resource
				}

				export namespace Loader {
					export interface Resource {
						getInputStream(): Packages.java.io.InputStream
						getLength(): {
							longValue(): number
						}
						getSourceName(): Packages.java.lang.String
						getLastModified(): Packages.java.util.Date
					}
				}
			}
		}

		//	TODO	move to appropriate directory
		export namespace jsh {
			export interface Shell {
				setRuntime: any
				getLoader: any
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

(
	function(
		$slime: slime.jrunscript.runtime.Exports,
		$api: $api,
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
)(jsh.unit["$slime"], $api, $loader, verify, tests, run);
