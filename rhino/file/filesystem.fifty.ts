//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.filesystem {
	export interface Context {
		Searchpath: any
		Pathname: slime.jrunscript.file.internal.file.Exports["Pathname"]
	}

	export interface Exports {
		Filesystem: new (provider: slime.jrunscript.file.internal.java.FilesystemProvider) => Filesystem
	}

	/**
	 * A representation of a filesystem that provides support for object-oriented APIs.
	 */
	export interface Filesystem {
		Pathname: (string: string) => slime.jrunscript.file.Pathname
		Searchpath: any
	}

	export type Script = slime.loader.Script<Context,Exports>
}