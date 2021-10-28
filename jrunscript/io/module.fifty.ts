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

	/**
	 * An object that builds on the internal runtime {@link slime.jrunscript.runtime.Exports} and
	 * {@link slime.jrunscript.runtime.io.Exports} types and provides an improved
	 * interface for callers.
	 */
	export interface Exports {
		Streams: slime.jrunscript.runtime.io.Exports["Streams"]
		Buffer: slime.jrunscript.runtime.io.Exports["Buffer"]
		Resource: slime.jrunscript.runtime.Exports["Resource"]
		Loader: slime.jrunscript.runtime.Exports["Loader"]
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
			zip: {
				encode: (p: {
					entries: { path: string, resource: slime.Resource }[]
					stream: slime.jrunscript.runtime.io.OutputStream
				}) => void

				decode: (p: {
					stream: slime.jrunscript.runtime.io.InputStream
					output: {
						file: (p: { path: string }) => slime.jrunscript.runtime.io.OutputStream
						directory: (p: { path: string }) => void
					}
				}) => void
			}
		}
		grid: any
		system: slime.jrunscript.runtime.io.Exports["system"]
	}

	export type load = slime.loader.Script<Context,Exports>
}