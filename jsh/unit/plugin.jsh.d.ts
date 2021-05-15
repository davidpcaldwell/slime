//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit {
	namespace internal.remote {
		interface Context {
			api: {
				java: slime.jrunscript.host.Exports
				unit: any
			}
		}

		interface Exports {
			Events: any
			Decoder: any
			Stream: any
		}
	}
}