//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Tools {
		docker: {
			engine: slime.jrunscript.tools.docker.Engine
			require: () => slime.$api.fp.world.old.Tell<slime.jrunscript.tools.docker.install.Events>
		}
		kubectl: slime.jrunscript.tools.docker.Exports["kubectl"] & {
			json: (invocation: slime.jrunscript.tools.kubernetes.cli.Invocation) => slime.$api.fp.world.old.Ask<slime.jrunscript.tools.kubernetes.cli.Events,object>
		}
	}
}
