//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native.inonit.script.runtime.io {
	export namespace Streams {
		export interface Events<T> {
			//	opaque to JavaScript
		}
	}

	export interface Streams {
		/**
		 * Creates an output stream that, when written to, will write the content written to each of two output streams.
		 *
		 * @param one The first output stream to which to write.
		 * @param two The second output stream to which to write.
		 * @returns An output stream that writes to both given output streams.
		 */
		split: (one: java.io.OutputStream, two: java.io.OutputStream) => java.io.OutputStream

		//	TODO	we don't really have a great way currently to represent bytes
		readBytes: (input: java.io.InputStream) => slime.jrunscript.Array<number>

		readString: (reader: slime.jrunscript.native.java.io.Reader) => slime.jrunscript.native.java.lang.String

		readAll: {
			(reader: slime.jrunscript.native.java.io.Reader, events: slime.jrunscript.native.inonit.script.runtime.io.Streams.Events<string>): void
		}

		readLines: {
			(reader: slime.jrunscript.native.java.io.Reader, delimiter: string, events: slime.jrunscript.native.inonit.script.runtime.io.Streams.Events<string>): void
		}

		copy: {
			(i: slime.jrunscript.native.java.io.InputStream, o: slime.jrunscript.native.java.io.OutputStream, closeInputStream?: boolean): void
			(r: slime.jrunscript.native.java.io.Reader, w: slime.jrunscript.native.java.io.Writer): void
		}

		readLine: (r: java.io.Reader, terminator: string) => java.lang.String
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const { Streams } = Packages.inonit.script.runtime.io;

			fifty.tests.Streams = fifty.test.Parent();
			fifty.tests.Streams.Bytes = fifty.test.Parent();
			fifty.tests.Streams.Bytes.Buffer = fifty.test.Parent();

			fifty.tests.Streams.Bytes.Buffer.fidelity = function() {
				var buffer = new Packages.inonit.script.runtime.io.Streams.Bytes.Buffer();
				var data = [ -3, 2, 5, -7 ];
				var write = buffer.getOutputStream();
				write.write(-3);
				write.write(2);
				write.write(5);
				write.write(-7);
				write.close();

				var read = buffer.getInputStream();
				var from = [];
				var b;
				while( (b = read.read()) != -1) {
					if (b > 127) {
						b -= 256;
					}
					from.push(b);
				}

				verify(data).evaluate(function(p) { return p.join(","); }).is(from.join(","));
			}

			fifty.tests.Streams.readLine = function() {
				var subject = new Streams();

				var s1 = "fff\nggg\nhhh";

				var split = function(s1: string, eol: string) {
					var r1 = new Packages.java.io.StringReader(s1);
					var lines: string[] = [];
					var line: string;
					while( (line = String(subject.readLine(r1, eol)) ) ) {
						fifty.global.jsh.shell.console("[" + line + "]");
						lines.push(line);
					}
					return lines;
				}

				var lines = split(s1,"\n");
				//	TODO	WTF? trailing newlines?
				verify(lines)[0].is("fff\n");
				verify(lines)[1].is("ggg\n");
				verify(lines)[2].is("hhh");

				var lines2 = split(s1, "\r\n");
				verify(lines2)[0] == s1;
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.Streams);
			}
		}
	//@ts-ignore
	)(Packages,fifty);
}
