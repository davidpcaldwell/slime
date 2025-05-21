//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime.io {
	export interface Context {
		_streams: slime.jrunscript.native.inonit.script.runtime.io.Streams

		api: {
			java: Pick<slime.jrunscript.java.Exports,"isJavaObject"|"isJavaType">

			Resource: new (p: {
				read: {
					string: () => string
				}
			}) => {
				read: (XMLList: slime.external.e4x.XMLListConstructor) => slime.external.e4x.XMLList
			}
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			return fifty.global.jsh.unit.$slime.io;
		//@ts-ignore
		})(fifty);

		export const toSignedByte = (b: number) => (b >= 128) ? (b-256) : b;

		export const javaInputStreamOf = (function(Packages: slime.jrunscript.Packages) {
			return (b: number[]) => new Packages.java.io.ByteArrayInputStream(b.map(toSignedByte));
		//@ts-ignore
		})(Packages);
	}

	type byte = number

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Charset: {
			standard: {
				utf8: Charset
			}
		}
	}

	export interface Charset {
		name: string

		java: {
			adapt: () => slime.jrunscript.native.java.nio.charset.Charset
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.exports.Charset = fifty.test.Parent();

			fifty.tests.exports.Charset.utf8 = function() {
				verify(test.subject.Charset.standard.utf8, "Charset.standard.utf8", it => {
					it.is.type("object");
					it.name.is.type("string");
					it.java.adapt().evaluate( jsh.java.isJavaType(Packages.java.nio.charset.Charset) ).is(true);
				});
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export namespace reader {
		export interface Configuration {
			charset: string
			LINE_SEPARATOR?: string
		}
	}

	export namespace text {
		export interface Configuration {
			charset: Charset
			newline: string
		}
	}

	export interface Exports {
		InputStream: {
			java: (p: slime.jrunscript.native.java.io.InputStream) => InputStream

			/**
			 * A set of operations that allow the creation of {@link InputStream}s from strings.
			 */
			string: {
				/**
				 * A version that allows the specification of an encoding when creating the input stream.
				 */
				encoding: (p: {
					string: string
					charset: Charset
				}) => InputStream

				default: (p: string) => InputStream
			}
		}
	}

	/**
	 * A stream from which bytes may be read.
	 */
	export interface InputStream {
		content: {
			string: {
				simple: (charset: Charset) => string
			}

			ArrayBuffer: {
				simple: () => ArrayBuffer
			}
		}

		/**
		 * Closes the underlying stream.
		 */
		close: () => void

		/** Operations that bridge to Java constructs. */
		java: {
			/** Returns a Java `java.io.InputStream` equivalent to this stream. */
			adapt: () => slime.jrunscript.native.java.io.InputStream

			// /** @deprecated Use `content.ArrayBuffer.simple` to get the content as an `ArrayBuffer`. */
			//	TODO	would like to deprecate this, see above, but this is used in other places to retrieve native Java byte
			//			arrays to create new streams. What we need is a stream implementation backed by an `ArrayBuffer`, and then
			//			callers can switch to that.
			array: () => slime.jrunscript.Array<byte>
		}

		/**
		 * @deprecated Use `Reader.stream` to create a `Reader` from an `InputStream`.
		 *
		 * A character input stream that reads this stream.
		 */
		character: (mode?: reader.Configuration) => Reader
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const { jsh } = fifty.global;

			fifty.tests.exports.InputStream = fifty.test.Parent();

			fifty.tests.exports.InputStream.string = fifty.test.Parent();

			fifty.tests.exports.InputStream.string.encoding = function() {
				var utf8 = test.subject.Charset.standard.utf8;

				var input = test.subject.InputStream.string.encoding({
					charset: utf8,
					string: "foo"
				});

				var string = input.content.string.simple(utf8);

				verify(string).is("foo");
			}

			fifty.tests.exports.InputStream.object = fifty.test.Parent();

			fifty.tests.exports.InputStream.object.content = fifty.test.Parent();

			fifty.tests.exports.InputStream.object.content.ArrayBuffer = fifty.test.Parent();

			fifty.tests.exports.InputStream.object.content.ArrayBuffer.simple = function() {
				var len = 19;
				var array = [];
				for (var i=0; i<len; i++) {
					array[i] = i;
				}

				var inputStream = test.subject.InputStream.java(
					test.javaInputStreamOf(array)
				);

				var ab = inputStream.content.ArrayBuffer.simple();

				verify(ab).byteLength.is(len);

				var i8 = new Uint8Array(ab);
				for (var i=0; i<len; i++) {
					verify(i8)[i].is(i);
				}
			}

			fifty.tests.exports.InputStream.object.close = function() {
				var input = test.subject.InputStream.string.default("it");
				input.close();
				verify(input).evaluate( function(i) { return i.content.string.simple(test.subject.Charset.standard.utf8); }).threw.type(Error);
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		OutputStream: (p: slime.jrunscript.native.java.io.OutputStream) => OutputStream
	}

	/**
	 * A stream to which bytes may be written.
	 */
	export interface OutputStream {
		/**
		 * Returns a character output stream that writes to this stream.
		 */
		character: () => Writer

		/**
		 * Closes the underlying stream.
		 */
		close: () => void

		/**
		 * Operations that bridge to Java constructs.
		 */
		java: {
			/**
			 * Returns a Java `java.io.OutputStream` equivalent to this stream.
			 */
			adapt: () => slime.jrunscript.native.java.io.OutputStream
		}

		//	Possibly unused
		split: (other: any) => OutputStream
	}

	export namespace old {
		/**
		 * @param line A line read from this stream.
		 *
		 * @returns If anything other than `undefined` is returned, `readLines` will terminate reading the stream (and pass the
		 * value to `onEnd`; see the second argument to `readLines`).
		 */
		export type ReadLinesCallback<T> = (line: string) => T

		/**
		 * @param t The value returned from the line processing function, if processing terminated because that function returned a
		 * value (see {@link ReadLinesCallback}).
		 */
		export type ReadLinesOnEnd<T> = (t?: T) => void

		/**
		 * An object representing the mode of operation of {@link ReadLines}.
		 */
		export type ReadLinesMode<T> = {
			/**
			 * The line terminator to use when parsing the stream. The underlying platform line terminator will be used if not
			 * specified.
			 */
			ending?: string

			/**
			 * A function that will be invoked when line processing terminates. The function will be invoked with this stream as `this`.
			 * The default implementation closes the stream.
			 */
			onEnd?: ReadLinesOnEnd<T>
		}

		/**
		 * @param callback A callback function.
		 */
		export type ReadLines = <T>(
			callback: ReadLinesCallback<T>,
			mode?: ReadLinesMode<T>
		) => T
	}

	export interface Exports {
		Reader: {
			stream: (p: {
				stream: InputStream
				configuration?: reader.Configuration
			}) => Reader

			java: (p: slime.jrunscript.native.java.io.Reader, properties?: { LINE_SEPARATOR?: string }) => Reader
		}
	}

	/**
	 * A stream from which characters may be read.
	 */
	export interface Reader {
		/**
		 * Closes the underlying stream.
		 */
		close: () => void

		/**
		 * Returns the entire content of this stream as a single string.
		 */
		asString: () => string

		//	TODO	very old API with superseded techniques; should create an updated version and deprecate this one
		/**
		 * Iterates through the lines in this stream, sending each in succession to a callback function.
		 */
		readLines: old.ReadLines

		/**
		 * Operations bridging to Java constructs.
		 */
		java: {
			/**
			 * Returns a Java `java.io.Reader` equivalent to this stream.
			 */
			adapt: () => slime.jrunscript.native.java.io.Reader
		}
	}

	export interface Reader {
		/**
		 * @deprecated No replacement; E4X is deprecated.
		 *
		 * Returns the entire content of this stream as a single {@link slime.external.e4x.XMLList}.
		 *
		 * This operation is only available if E4X is available.
		 */
		 asXml?: () => slime.external.e4x.XMLList
	}

	(
		function(
			$platform: slime.runtime.Platform,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			if ($platform.e4x) {
				fifty.tests.E4X = function() {
					var buffer = new test.subject.Buffer();
					buffer.writeBinary().character().write("<a><b/></a>");
					buffer.writeBinary().close();
					var xml = { list: buffer.readText().asXml() };
					verify(xml).evaluate(function(p) { return p.list.length(); }).is(1);
				}
			}
		}
	//@ts-ignore
	)($platform,fifty);

	export interface Exports {
		Writer: {
			old: (p: slime.jrunscript.native.java.io.Writer) => OldWriter

			java: (p: {
				java: slime.jrunscript.native.java.io.Writer
				newline: string
			}) => Writer

			stream: (p: {
				stream: OutputStream
				charset: Charset
				newline: string
			}) => Writer
		}
	}

	/**
	 * A stream to which characters can be written.
	 */
	export interface Writer {
		/**
		 * Writes a string to the stream.
		 */
		write: {
			/**
			 * @param string A string to write to the stream.
			 */
			(string: string): void

			/** @deprecated */
			(e4x: slime.external.e4x.Object): void
		}

		line: (p: string) => void

		/**
		 * Closes the underlying stream.
		 */
		close: () => void

		/**
		 * Operations that bridge to Java constructs.
		 */
		java: {
			/**
			 * Returns a Java `java.io.Writer` equivalent to this character output stream.
			 */
			adapt: () => slime.jrunscript.native.java.io.Writer
		}
	}

	export type OldWriter = Omit<Writer, "line">

	export interface Buffer {
		/**
		 * Closes the buffer so that no additional bytes can be written to it.  Until the buffer is closed, an attempt to read from
		 * it cannot reach the end of the stream, but will instead block waiting for more input.
		 */
		close: () => void

		/**
		 * A stream which inserts bytes written to it into this buffer.
		 */
		writeBinary: () => OutputStream

		/**
		 * A stream which inserts characters written to it into this buffer.
		 */
		writeText: () => Writer

		/**
		 * A stream from which the bytes in this buffer may be read.
		 */
		readBinary: () => InputStream

		/**
		 * A stream from which the characters in this buffer may be read.
		 */
		readText: () => Reader
	}

	type BinaryCopyMode = {
		onFinish: (i: slime.jrunscript.native.java.io.InputStream, o: slime.jrunscript.native.java.io.OutputStream) => void
	}

	export interface Exports {
		ArrayBuffer: {
			read: (stream: InputStream) => ArrayBuffer
		}
	}

	export interface Exports {
		/**
		 * Provides operations for processing streams of input or output.
		 */
		Streams: {
			/**
			 * Provides operations for processing byte streams.
			 */
			binary: {
				/**
				 * Copies a byte input stream to a byte output stream.
				 *
				 * @param from A stream from which to copy bytes.
				 * @param to A stream to which to copy bytes.
				 */
				copy: {
					(from: slime.jrunscript.runtime.io.InputStream, to: slime.jrunscript.runtime.io.OutputStream, mode?: BinaryCopyMode): void
					(from: slime.jrunscript.runtime.io.InputStream, to: slime.jrunscript.native.java.io.OutputStream, mode?: BinaryCopyMode): void
				}
			}

			/**
			 * Provides operations for processing character streams.
			 */
			text: {
				/**
				 * Copies a character input stream to a character output stream.
				 *
				 * @param from A stream from which to copy characters.
				 * @param to A stream to which to copy characters.
				 */
				copy: (from: slime.jrunscript.runtime.io.Reader, to: slime.jrunscript.runtime.io.Writer) => void
			}

			java: {
				/**
				 * Converts a Java object to a corresponding type from this package.
				 */
				adapt: {
					(_stream: slime.jrunscript.native.java.io.InputStream): InputStream
					(_stream: slime.jrunscript.native.java.io.OutputStream): OutputStream
					(_stream: slime.jrunscript.native.java.io.Reader): Reader
					(_stream: slime.jrunscript.native.java.io.Writer): Writer
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
			const module = test.subject;

			fifty.tests.Streams = function() {
				var _out: slime.jrunscript.native.java.io.OutputStream = new Packages.java.io.ByteArrayOutputStream();
				var out = module.Streams.java.adapt(_out);
				verify(out).is.type("object");
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		/**
		 * Creates a buffer to which bytes can be written, and later read.
		 */
		 Buffer: new () => Buffer
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;

			fifty.tests.Buffer = function() {
				run(function old() {
					var b = new test.subject.Buffer();
					var out = b.writeText();
					out.write("foo!");
					out.close();
					var bytes = b.readBinary();
					var characters = bytes.character();
					var string = characters.asString();
					verify(string).is("foo!");
				});

				run(function jsapi() {
					var buffer = new test.subject.Buffer();
					var writer = buffer.writeText();
					writer.write("Buffer readLines\n");

					var lines = [];

					buffer.readText().readLines(function(s) {
						lines.push(s);
						return lines;
					}, { ending: "\n" });

					verify(lines).length.is(1);

					buffer.close();
				});

				var utf8 = test.subject.Charset.standard.utf8;
				var b = new test.subject.Buffer();
				var write = b.writeBinary();
				var writer = test.subject.Writer.stream({
					stream: write,
					charset: utf8,
					newline: "\n"
				});
				writer.write("bar!");
				writer.close();
				var read = b.readBinary();
				var text = test.subject.Reader.stream({
					stream: read,
					configuration: {
						charset: utf8.name,
						LINE_SEPARATOR: "\n"
					}
				})
				// var text = utf8.read(read);
				var string = text.asString();
				verify(string).is("bar!");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		system: {
			delimiter: {
				line: string
			}
		}
	}

	export interface Events<T> {
		progress: T
		done: void
	}

	export interface LineEvents extends Events<string> {
		line: string
	}

	export type Processor<E> = {
		means: slime.$api.fp.world.Means<InputStream,E>
		handlers?: slime.$api.event.Handlers<E>
	}

	export interface StringProcessor {
		all: (handlers: slime.$api.event.Handlers<Events<string>>) => Processor<Events<string>>
		lines: (terminator: string) => (handlers: slime.$api.event.Handlers<LineEvents>) => Processor<LineEvents>
	}

	export interface Exports {
		wo: {
			process: <E>(processor: Processor<E>) => (input: InputStream) => void

			character: {
				encoding: (encoding?: string) => StringProcessor
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			var original = "foo\nbar\nbaz";

			fifty.tests.exports.input = fifty.test.Parent();

			fifty.tests.exports.input.processor = fifty.test.Parent();

			fifty.tests.exports.input.processor.string = function() {
				var input = test.subject.InputStream.string.default(original);
				var all: string;
				test.subject.wo.process(
					test.subject.wo.character.encoding().all({
						progress: function(e) {
							all = e.detail;
						}
					})
				)(input);
				verify(all).is(original);
			}

			fifty.tests.exports.input.processor.lines = function() {
				fifty.run(function noTerimnator() {
					var input = test.subject.InputStream.string.default(original);
					var all: string = "";
					var lines: string[] = [];
					test.subject.wo.process(
						test.subject.wo.character.encoding().lines("\n")({
							progress: function(e) {
								all += e.detail;
							},
							line: function(e) {
								lines.push(e.detail);
							}
						})
					)(input);
					verify(all).is(original);
					verify(lines).length.is(3);
					verify(lines)[0].is("foo");
					verify(lines)[1].is("bar");
					verify(lines)[2].is("baz");
				});

				fifty.run(function terminator() {
					var input = test.subject.InputStream.string.default(original + "\n");
					var all: string = "";
					var lines: string[] = [];
					test.subject.wo.process(
						test.subject.wo.character.encoding().lines("\n")({
							progress: function(e) {
								all += e.detail;
							},
							line: function(e) {
								lines.push(e.detail);
							}
						})
					)(input);
					verify(all).is(original + "\n");
					verify(lines).length.is(4);
					verify(lines)[0].is("foo");
					verify(lines)[1].is("bar");
					verify(lines)[2].is("baz");
					verify(lines)[3].is("");
				})
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;

			fifty.tests.suite = function() {
				verify(test.subject,"subject").is.type("object");

				run(fifty.tests.exports);

				run(fifty.tests.Streams);
				run(fifty.tests.Buffer);

				if (fifty.tests.E4X) run(fifty.tests.E4X);

			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.manual = {};

			fifty.tests.manual.charsets = function() {
				var _map = Packages.java.nio.charset.Charset.availableCharsets();
				var _keys = _map.keySet().iterator();
				while(_keys.hasNext()) {
					jsh.shell.console(String(_keys.next()));
				}
				var _default = Packages.java.nio.charset.Charset.defaultCharset();
				jsh.shell.console(String(_default));
			};

			fifty.tests.manual.engine = function() {
				var global = (function() { return this; })();
				//	Next two present in both Rhino 1.7.15 and Nashorn 15.4
				jsh.shell.console("ArrayBuffer: " + global["ArrayBuffer"]);
				jsh.shell.console("Uint8Array: " + global["Uint8Array"]);
				jsh.shell.console("Blob: " + global["Blob"]);
				jsh.shell.console("File: " + global["File"]);
			}

			fifty.tests.manual.ArrayBuffer = function() {
				var buffer = new ArrayBuffer(16);
				var write = new Int8Array(buffer);
				for (var i=0; i<16; i++) {
					write[i] = i*2;
				}
				var read = new Int8Array(buffer);
				var out = (fifty.global.jsh) ? jsh.shell.console : console.log;
				out( Array.prototype.join.call(read, " ") );
			}

			fifty.tests.manual.wip = function() {
			}
		}
	//@ts-ignore
	)(Packages,fifty);
}
