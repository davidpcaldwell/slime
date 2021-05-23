//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.internal.jsh.launcher {
	export interface Slime {
		built: any
		launcher: any
		home: any
		setting: any
		settings: any
		src?: {
			getSourceFilesUnder: any
			File: any
			getFile: any
			getPath: any
		}
	}
}