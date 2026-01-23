//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native {
	export namespace inonit.script.runtime.io {
		export interface Filesystem {
			getPathnameSeparator(): slime.jrunscript.native.java.lang.String
			getSearchpathSeparator(): slime.jrunscript.native.java.lang.String
			getLineSeparator(): slime.jrunscript.native.java.lang.String

			getNode(path: string): Filesystem.Node
			getNode(file: slime.jrunscript.native.java.io.File): Filesystem.Node

			isPosix(): boolean
		}

		export namespace Filesystem {
			/**
			 * A filesystem path, corresponding to a `java.io.File`.
			 */
			export interface Node {
				getScriptPath: () => slime.jrunscript.native.java.lang.String
				getHostFile: () => slime.jrunscript.native.java.io.File

				exists: () => boolean
				isDirectory: () => boolean

				getParent: () => Node

				readBinary: () => slime.jrunscript.native.java.io.InputStream
				readText: () => slime.jrunscript.native.java.io.Reader
				writeBinary: (append: boolean) => slime.jrunscript.native.java.io.OutputStream
				writeText: (append: boolean) => slime.jrunscript.native.java.io.Writer

				mkdir: () => void

				isSymlink: () => boolean
				delete: (events: Node.DeleteEvents) => boolean

				move: (to: Node) => void

				list: () => slime.jrunscript.Array<Node>

				//	TODO	exists only for Cygwin
				invalidate: () => void

				getPosixAttributes: () => slime.jrunscript.native.java.nio.file.attribute.PosixFileAttributes
				setPosixAttributes: (owner: string, group: string, permissions: slime.jrunscript.native.java.util.Set<slime.jrunscript.native.java.nio.file.attribute.PosixFilePermission>) => void
			}

			export namespace Node {
				export interface DeleteEvents extends slime.jrunscript.native.java.lang.Object {
					error: (message: slime.jrunscript.native.java.lang.String) => void
				}
			}
		}
	}
}
