//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.runtime.io {
	export interface InputStream {
		character(mode?: any): Reader
		close()
		java: {
			adapt(): slime.jrunscript.native.java.io.InputStream
			array(): any
		}
	}

	export interface OutputStream {
		character(): Writer
		java: {
			adapt(): slime.jrunscript.native.java.io.OutputStream
		}
	}

	export interface Reader {
		close()
		asString(): string
		readLines: any
	}

	export interface Writer {
		write(string: string)
		close()
	}

	export interface Buffer {
		close()
		readBinary(): InputStream
		writeBinary(): OutputStream
		readText(): Reader
		writeText(): Writer
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
		OutputStream: any
		Writer: any
		InputStream: new (p: slime.jrunscript.native.java.io.InputStream) => InputStream
		Reader: any
		Streams: {
			binary: {
				copy(from: slime.jrunscript.runtime.io.InputStream, to: slime.jrunscript.runtime.io.OutputStream, mode?: BinaryCopyMode)
			}
			text: {
				copy(from: any, to: any)
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
	}
}

(
	function(
		$slime: slime.jrunscript.runtime.Exports,
		verify: slime.fifty.test.verify,
		tests: slime.fifty.test.tests,
		run: slime.fifty.test.run
	) {
		tests.Buffer = function() {
			var b = new $slime.io.Buffer();
			var out = b.writeText();
			out.write("foo!");
			out.close();
			var bytes = b.readBinary();
			var characters = bytes.character();
			var string = characters.asString();
			verify(string).is("foo!");
		}

		tests.suite = function() {
			verify($slime).io.is.type("object");
			run(tests.Buffer);
		}
	}
//@ts-ignore
)(jsh.unit["$slime"], verify, tests, run);
