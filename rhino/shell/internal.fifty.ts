//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.internal {
	/** Given an environment specification, what arguments to the `env` command would implement it? */
	export type GetEnvArguments = (environment: slime.jrunscript.shell.environment.Specification) => string[]
}
