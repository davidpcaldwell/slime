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
		}

		export namespace Filesystem {
			export interface Node {
				getScriptPath: () => slime.jrunscript.native.java.lang.String
				exists(): boolean
				isDirectory(): boolean
				readBinary(): slime.jrunscript.native.java.io.InputStream
				readText(): slime.jrunscript.native.java.io.Reader
				writeBinary(append: boolean): slime.jrunscript.native.java.io.OutputStream
				writeText(append: boolean): slime.jrunscript.native.java.io.Writer
				mkdirs()
				getHostFile(): slime.jrunscript.native.java.io.File
				delete()
				move(to: Node)
				list(pattern: slime.jrunscript.native.java.io.FilenameFilter): Node[]

				//	TODO	exists only for Cygwin
				invalidate()
			}
		}
	}
}
