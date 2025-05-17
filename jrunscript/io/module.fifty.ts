//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.io {
	export interface Context {
		$slime: slime.jrunscript.runtime.Exports
		api: {
			/**
			 * The `jrunscript/host` module.
			 */
			java: slime.jrunscript.java.Exports
		}
		nojavamail: boolean
	}

	/**
	 * Much of the content of the `jrunscript/io` module is provided by the {@link slime.jrunscript.runtime.Exports | Java SLIME
	 * runtime} and its {@link slime.jrunscript.runtime.io.Exports | I/O module}, which supplies the `Resource`, and `Loader`
	 * exports, and whose `io` property supplies the `Streams` and `Buffer` exports.
	 */
	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		InputStream: {
			from: {
				string: (value: string) => slime.jrunscript.runtime.io.InputStream
				java: (native: slime.jrunscript.native.java.io.InputStream) => slime.jrunscript.runtime.io.InputStream
			}
			string: slime.$api.fp.world.Sensor<slime.jrunscript.runtime.io.InputStream,void,string>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.exports.InputStream = function() {
				var stream = jsh.io.InputStream.from.string("Hey");
				var read = stream.character().asString();
				verify(read).is("Hey");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		loader: slime.jrunscript.runtime.Exports["jrunscript"]["loader"]
		Entry: slime.jrunscript.runtime.Exports["jrunscript"]["Entry"]
	}

	export interface Exports {
		Resource: slime.jrunscript.runtime.Exports["Resource"] & slime.jrunscript.runtime.Exports["jrunscript"]["Resource"]
	}

	export namespace archive {
		type AnyEntry = {
			path: string
		}

		export type Directory<X extends {}> = AnyEntry & X

		export type File<X extends {}> = AnyEntry & {
			content: slime.jrunscript.runtime.io.InputStream
		} & X

		export type Entry<X extends {}> = Directory<X> | File<X>

		/**
		 * A format that can encode a series of resources with paths (like a directory structure) as a single stream, and decode that
		 * stream into a series of resources with paths.
		 */
		export interface Format<X extends {} = {}> {
			encode: (p: {
				entries: slime.$api.fp.Stream<Entry<X>>
				to: slime.jrunscript.runtime.io.OutputStream
			}) => void

			decode: (p: {
				stream: slime.jrunscript.runtime.io.InputStream
				// output: {
				// 	/**
				// 	 * Callback method which requests an output stream to which to write the contents of a file within the ZIP.
				// 	 *
				// 	 * @param p A path in the ZIP file reprsenting a file
				// 	 * @returns An output stream to which the contents of the file should be written
				// 	 */
				// 	file: (p: { path: string }) => slime.jrunscript.runtime.io.OutputStream

				// 	/**
				// 	 * Callback method encountered when the decoder encounters a path in the ZIP file representing a folder.
				// 	 *
				// 	 * @param p A path in the ZIP file representing a folder
				// 	 */
				// 	directory: (p: { path: string }) => void
				// }
			}) => slime.$api.fp.Stream<Entry<X>>
		}
	}


	export interface Exports {
		Streams: slime.jrunscript.runtime.io.Exports["Streams"]
		Buffer: slime.jrunscript.runtime.io.Exports["Buffer"]
		Loader: slime.jrunscript.runtime.Exports["Loader"]
		old: slime.jrunscript.runtime.Exports["old"]
		java: {
			//	JSAPI documentation said this was deprecated, but replaced by what? Calls to `Streams`?
			/**
			 * Invokes the `Streams.java.adapt()` function.
			 */
			adapt: {
				(native: slime.jrunscript.native.java.io.InputStream): slime.jrunscript.runtime.io.InputStream
				(native: slime.jrunscript.native.java.io.OutputStream): slime.jrunscript.runtime.io.OutputStream
				(native: slime.jrunscript.native.java.io.Reader): slime.jrunscript.runtime.io.Reader
				(native: slime.jrunscript.native.java.io.Writer): slime.jrunscript.runtime.io.Writer
			}
		}
		mime: slime.jrunscript.io.mime.Exports
		archive: {
			zip: archive.Format
		}
		grid: slime.jrunscript.io.grid.Exports
		system: slime.jrunscript.runtime.io.Exports["system"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				fifty.load("grid.fifty.ts");
				fifty.load("zip.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);

	/**
	 * An object that builds on the internal runtime {@link slime.jrunscript.runtime.Exports} provided in its {@link Context}
	 * (particularly its `io` property of type {@link slime.jrunscript.runtime.io.Exports}), provides an improved interface for
	 * callers, and adds miscellaneous capabilities (relating to MIME types, the ZIP compression format, and grid-based environments
	 * like Excel).
	 */
	export type Script = slime.loader.Script<Context,Exports>
}
