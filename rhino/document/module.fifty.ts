//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.document {
	export namespace exports {
		/**
		 * Provides the ability to create {@link slime.old.document.Document} objects by parsing XML.
		 */
		export interface Document {
			new (p: {
				/** A string to parse. */
				string: string
			}): slime.old.document.Document

			new (p: { file: slime.jrunscript.file.File }): slime.old.document.Document

			new (p: {
				/** A stream from which to read the document. */
				stream: slime.jrunscript.runtime.io.InputStream
			}): slime.old.document.Document

			Html: any
		}
	}
}

namespace slime.jrunscript.document {
	export interface Context {
		/**
		 * The `js/document` module.
		 */
		pure: slime.old.document.Exports

		api: {
			java: slime.jrunscript.java.Exports
		}
	}


	export interface Exports {
		/** @deprecated */
		Document: slime.runtime.document.exports.Document

		Text: any
		Element: any
		Cdata: any

		/** @deprecated */
		filter: any
		/** @deprecated */
		namespace: any
	}

	export type Script = slime.loader.Script<Context,Exports>
}
