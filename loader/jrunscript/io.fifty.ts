namespace slime.jrunscript.runtime.io {
	export interface InputStream {
		character(mode?: any): Reader
		close()
		java: {
			adapt(): Packages.java.io.InputStream
			array(): any
		}
	}

	export interface OutputStream {
	}

	export interface Reader {
		close()
		asString(): string
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
		_streams: Packages.inonit.script.runtime.io.Streams
		api: {
			java: slime.jrunscript.host.Exports
			Resource: any
		}
	}

	export interface Exports {
		OutputStream: any
		Writer: any
		InputStream: new (p: Packages.java.io.InputStream) => InputStream
		Reader: any
		Streams: {
			binary: {
				copy(from: any, to: any, mode: any)
			}
			text: {
				copy(from: any, to: any)
			}
			java: {
				adapt: {
					(_stream: Packages.java.io.InputStream): InputStream
					(_stream: Packages.java.io.OutputStream): OutputStream
					(_stream: Packages.java.io.Reader): Reader
					(_stream: Packages.java.io.Writer): Writer
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
