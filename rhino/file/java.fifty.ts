//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.java {
	export interface Context {
		Pathname: any
		spi: any
		api: {
			io: any
			defined: any
		}
	}

	export interface Exports {
		FilesystemProvider: {
			new (_peer: slime.jrunscript.native.inonit.script.runtime.io.Filesystem): any
			os: any
		}
	}

	export type Script = slime.loader.Script<Context,Exports>
}