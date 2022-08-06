//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime.io {
	export interface InputStream {
		character: (mode?: any) => Reader
		close: () => void
		java: {
			adapt: () => slime.jrunscript.native.java.io.InputStream
			array: () => any
		}
	}

	export interface OutputStream {
		character: () => Writer
		close: () => void
		java: {
			adapt: () => slime.jrunscript.native.java.io.OutputStream
		}
		//	Possibly unused
		split: (other: any) => OutputStream
	}

	export interface Reader {
		close: () => void
		asString: () => string
		readLines: (
			callback: (line: string) => any,
			mode?: {
				ending?: string
				onEnd?: () => void
			}
		) => void
	}

	export interface Writer {
		write: {
			(string: string): void
			/** @deprecated */
			(e4x: slime.external.e4x.Object): void
		}
		close: () => void
		java: {
			adapt: () => slime.jrunscript.native.java.io.Writer
		}
	}

	export interface Charset {
		read: (input: InputStream) => Reader
		write: (output: OutputStream) => Writer
	}

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

	export interface Context {
		_streams: slime.jrunscript.native.inonit.script.runtime.io.Streams
		api: {
			java: slime.jrunscript.host.Exports
			Resource: any
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			return fifty.global.jsh.unit.$slime.io;
		//@ts-ignore
		})(fifty);
	}

	type BinaryCopyMode = {
		onFinish: (i: slime.jrunscript.native.java.io.InputStream, o: slime.jrunscript.native.java.io.OutputStream) => void
	}

	export interface Exports {
		InputStream: (p: slime.jrunscript.native.java.io.InputStream) => InputStream
		OutputStream: (p: slime.jrunscript.native.java.io.OutputStream) => OutputStream

		Reader: (p: slime.jrunscript.native.java.io.Reader, properties?: { LINE_SEPARATOR?: string }) => Reader
		Writer: (p: slime.jrunscript.native.java.io.Writer) => Writer

		Charset: {
			standard: {
				utf8: Charset
			}
		}

		Streams: {
			binary: {
				copy: (from: slime.jrunscript.runtime.io.InputStream, to: slime.jrunscript.runtime.io.OutputStream, mode?: BinaryCopyMode) => void
			}
			text: {
				copy: (from: slime.jrunscript.runtime.io.Reader, to: slime.jrunscript.runtime.io.Writer) => void
			}
			java: {
				adapt: {
					(_stream: slime.jrunscript.native.java.io.InputStream): InputStream
					(_stream: slime.jrunscript.native.java.io.OutputStream): OutputStream
					(_stream: slime.jrunscript.native.java.io.Reader): Reader
					(_stream: slime.jrunscript.native.java.io.Writer): Writer
				}
			}
		}

		/**
		 * Creates a buffer to which bytes can be written, and later read.
		 */
		Buffer: new () => Buffer

		system: {
			delimiter: {
				line: string
			}
		}
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

				var utf8 = test.subject.Charset.standard.utf8;
				var b = new test.subject.Buffer();
				var write = b.writeBinary();
				var writer = utf8.write(write);
				writer.write("bar!");
				writer.close();
				var read = b.readBinary();
				var text = utf8.read(read);
				var string = text.asString();
				verify(string).is("bar!");
			}

			fifty.tests.suite = function() {
				verify(test.subject,"subject").is.type("object");
				run(fifty.tests.Buffer);
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
			}
		}
	//@ts-ignore
	)(Packages,fifty);
}
