//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	LICENSE`
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		test: {
			relaunchInDebugger: any
			Suite: any
			integration: any
			requireBuiltShell: (p?: {
				rhino: slime.jrunscript.file.Pathname
				src: slime.jrunscript.file.Directory
			}) => void
			mock: any
			launcher: any
		}
	}
}
