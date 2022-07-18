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

	export interface Buffer {
		close: () => void
		readBinary: () => InputStream
		writeBinary: () => OutputStream
		readText: () => Reader
		writeText: () => Writer
	}

	export interface Context {
		_streams: slime.jrunscript.native.inonit.script.runtime.io.Streams
		api: {
			java: slime.jrunscript.host.Exports
			Resource: any
		}
	}

	type BinaryCopyMode = {
		onFinish: (i: slime.jrunscript.native.java.io.InputStream, o: slime.jrunscript.native.java.io.OutputStream) => void
	}

	export interface Exports {
		OutputStream: (p: slime.jrunscript.native.java.io.OutputStream) => OutputStream
		Writer: (p: slime.jrunscript.native.java.io.Writer) => Writer

		InputStream: new (p: slime.jrunscript.native.java.io.InputStream) => InputStream
		Reader: new (p: slime.jrunscript.native.java.io.Reader, properties?: { LINE_SEPARATOR?: string }) => Reader

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

		Buffer: new () => Buffer

		system: {
			delimiter: {
				line: string
			}
		}
	}
}

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		const { verify, run } = fifty;
		const { $slime } = fifty.global.jsh.unit;

		fifty.tests.Buffer = function() {
			var b = new $slime.io.Buffer();
			var out = b.writeText();
			out.write("foo!");
			out.close();
			var bytes = b.readBinary();
			var characters = bytes.character();
			var string = characters.asString();
			verify(string).is("foo!");
		}

		fifty.tests.suite = function() {
			verify($slime).io.is.type("object");
			run(fifty.tests.Buffer);
		}
	}
//@ts-ignore
)(fifty);
