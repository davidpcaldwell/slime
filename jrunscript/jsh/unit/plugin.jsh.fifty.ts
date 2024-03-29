//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit {
	export interface Exports {
		html: {
			Part: any
			cli: any
			Suite: any
			documentation: any
		}
		/** @deprecated */
		part: {
			/** @deprecated Replaced by `html.Part` */
			Html: any
		}
		Suite: any
		interface: any
		$slime: slime.jsh.plugin.$slime
		jsapi: any
		Verify: slime.definition.verify.Export
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
				 * The `tools/fifty/test.jsh.js` script.
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
			Decoder: any
		}
		Scenario: any
		view: any
		View: any
		getStructure: any
	}
}

namespace slime.jsh {
	export interface Global {
		unit: slime.jsh.unit.Exports
	}
}
