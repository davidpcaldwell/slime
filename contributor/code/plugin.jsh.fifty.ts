//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export namespace project {
		export interface Exports {
			code: slime.project.code.Exports
			openapi: slime.project.openapi.Plugin
		}
	}

	export interface Global {
		project: slime.jsh.project.Exports
	}
}
