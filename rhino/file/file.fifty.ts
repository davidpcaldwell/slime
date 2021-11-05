//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	export interface Pathname {
		directory: Directory
		basename: string
		parent: Pathname
		createDirectory: (p?: { exists?: (d: Directory) => boolean, recursive?: boolean } ) => Directory
		write: slime.jrunscript.runtime.Resource["write"]
		file: File
		java: {
			adapt: () => slime.jrunscript.native.java.io.File
		}
	}

	export namespace pathname {
		export interface WriteMode {
			append?: boolean
			recursive?: boolean

			/** @deprecated Replaced by `append` (with opposite semantics). */
			overwrite?: boolean
		}
	}
}

namespace slime.jrunscript.file.internal.file {
	export interface Context {
		Resource: slime.jrunscript.file.Context["api"]["io"]["Resource"]
		constant: any
		fail: any
		isPathname: any
		Streams: any
		pathext: any
	}

	export interface Exports {
		Searchpath: any
		Pathname: any
		list: slime.jrunscript.file.Exports["list"]
	}
}