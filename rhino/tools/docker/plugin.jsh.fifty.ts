//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Tools {
		docker: {
			engine: slime.jrunscript.tools.docker.Engine
			require: () => slime.$api.fp.impure.Tell<slime.jrunscript.tools.docker.install.Events>
		}
	}
}