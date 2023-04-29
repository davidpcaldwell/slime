//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native.inonit.script.runtime.io {
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

		copy: {
			(i: slime.jrunscript.native.java.io.InputStream, o: slime.jrunscript.native.java.io.OutputStream, closeInputStream?: boolean): void
			(r: slime.jrunscript.native.java.io.Reader, w: slime.jrunscript.native.java.io.Writer): void
		}

		readLine: (r: java.io.Reader, terminator: string) => java.lang.String
	}
}
