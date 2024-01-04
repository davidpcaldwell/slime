//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.io.zip {
	export interface Context {
		Streams: slime.jrunscript.runtime.io.Exports["Streams"]
		InputStream: slime.jrunscript.runtime.io.Exports["InputStream"]["from"]["java"]
	}

	export interface Exports {
		encode: (p: {
			entries: { path: string, resource: slime.jrunscript.runtime.old.Resource }[]
			stream: slime.jrunscript.runtime.io.OutputStream
		}) => void

		decode: (p: {
			stream: slime.jrunscript.runtime.io.InputStream
			output: {
				/**
				 * Callback method which requests an output stream to which to write the contents of a file within the ZIP.
				 *
				 * @param p A path in the ZIP file reprsenting a file
				 * @returns An output stream to which the contents of the file should be written
				 */
				file: (p: { path: string }) => slime.jrunscript.runtime.io.OutputStream

				/**
				 * Callback method encountered when the decoder encounters a path in the ZIP file representing a folder.
				 *
				 * @param p A path in the ZIP file representing a folder
				 */
				directory: (p: { path: string }) => void
			}
		}) => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
