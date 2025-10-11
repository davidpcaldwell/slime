//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native.inonit.script.jsh.launcher {
	export interface Shell {
		getPackaged: () => slime.jrunscript.native.java.io.File
		getRhinoClasspath: () => slime.jrunscript.Array<slime.jrunscript.native.java.net.URL>
	}
}
