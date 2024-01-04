//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.io {
	export interface Context {
		$slime: slime.jrunscript.runtime.Exports
		api: {
			java: slime.jrunscript.host.Exports
		}
		nojavamail: boolean
	}

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
			string: slime.$api.fp.world.Meter<slime.jrunscript.runtime.io.InputStream,void,string>
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

	export interface Exports {
		Streams: slime.jrunscript.runtime.io.Exports["Streams"]
		Buffer: slime.jrunscript.runtime.io.Exports["Buffer"]
		Loader: slime.jrunscript.runtime.Exports["Loader"]
		old: slime.jrunscript.runtime.Exports["old"]
		java: {
			adapt: {
				(native: slime.jrunscript.native.java.io.InputStream): slime.jrunscript.runtime.io.InputStream
				(native: slime.jrunscript.native.java.io.OutputStream): slime.jrunscript.runtime.io.OutputStream
				(native: slime.jrunscript.native.java.io.Reader): slime.jrunscript.runtime.io.Reader
				(native: slime.jrunscript.native.java.io.Writer): slime.jrunscript.runtime.io.Writer
			}
		}
		mime: slime.jrunscript.io.mime.Exports
		archive: {
			zip: slime.jrunscript.io.zip.Exports
		}
		grid: any
		system: slime.jrunscript.runtime.io.Exports["system"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				fifty.load("grid.fifty.ts");
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
