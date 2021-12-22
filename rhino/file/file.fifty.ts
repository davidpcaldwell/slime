//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file {
	/**
	 * An object representing a path in the local file system.
	 */
	export interface Pathname {
		directory: Directory

		/**
		 * The name of this file, excluding any path information; for example, `"ls"` if this Pathname represents `/bin/ls`.
		 */
		readonly basename: string

		/**
		 * A `Pathname` representing the path of the parent directory of this `Pathname`, or `null` if this Pathname is at the top
		 * of the hierarchy.
		 */
		readonly parent: Pathname

		createDirectory: (p?: {
			exists?: (d: Directory) => boolean
			recursive?: boolean

			/** @deprecated Use `exists`. */
			ifExists?: (d: Directory) => boolean
		}) => Directory
		write: slime.jrunscript.runtime.Resource["write"]

		/**
		 * An object representing the file located at the location of this `Pathname`, or `null` if a (non-directory) file with
		 * this `Pathname` does not exist.
		 */
		readonly file: File

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
	export type firstDefined = <T extends { [x: string]: any }>(o: T, ...names: (keyof T)[]) => any

	export interface Context {
		Resource: slime.jrunscript.io.Exports["Resource"]
		Streams: slime.jrunscript.io.Exports["Streams"]
		isPathname: (item: any) => item is slime.jrunscript.file.Pathname
		pathext: string[]
	}

	export interface Exports {
		Searchpath: new (parameters: {
			filesystem: slime.jrunscript.file.internal.java.FilesystemProvider
			array: slime.jrunscript.file.Pathname[]
		}) => any

		//	TODO	the constructor for Pathname is really filesystem/peer or filesystem/path

		Pathname: new (parameters: {
			filesystem: slime.jrunscript.file.internal.java.FilesystemProvider
			peer?: slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node
			path?: string

			$filesystem?: slime.jrunscript.file.internal.java.FilesystemProvider
			$peer?: slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node
			$path?: any
		}) => Pathname
		list: slime.jrunscript.file.Exports["list"]
	}

	export type Script = slime.loader.Script<Context,Exports>
}