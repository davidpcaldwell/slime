//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.document {
	export namespace exports {
		export interface Document {
			new (p: { string: string }): any
			new (p: { file: slime.jrunscript.file.File }): any
			Html: any
		}
	}
}
namespace slime.jrunscript.document {

	export interface Export {
		/** @deprecated */
		Document: slime.runtime.document.exports.Document

		/** @deprecated */
		filter: any
		/** @deprecated */
		namespace: any
	}
}