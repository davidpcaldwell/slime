//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.internal.run {
	export type Export = (context: any, configuration: any, stdio: any, module: any, events: any, p: any, result: any) => void
	export type Factory = slime.loader.Product<void,Export>
}
