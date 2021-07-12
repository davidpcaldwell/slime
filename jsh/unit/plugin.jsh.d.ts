//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit {
	namespace internal.remote {
		interface Context {
			api: {
				java: slime.jrunscript.host.Exports
				unit: any
			}
		}

		interface Exports {
			Events: any
			Decoder: any
			Stream: any
		}
	}
}

namespace slime.jsh {
	interface Global {
		unit: {
			mock: slime.jsh.unit.mock;
			html: any
			Suite: any
			interface: any
			$slime: slime.jsh.plugin.$slime
			jsapi: any
			Verify: slime.definition.unit.Verify.Factory
			fifty: {
				/**
				 * Creates a Part that can be used in a jsapi test suite from a Fifty test file.
				 */
				Part: (p: {
					/**
					 * The shell in which to run Fifty.
					 */
					shell: slime.jrunscript.file.Directory

					/**
					 * The `loader/api/test/fifty/test.jsh.js` script.
					 */
					script: slime.jrunscript.file.File

					/**
					 * The Fifty test file to run.
					 */
					file: slime.jrunscript.file.File
				}) => any
			}
			JSON: {
				Encoder: any
			}
		}
	}
}
