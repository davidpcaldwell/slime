//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.file.internal.java {
	export interface Context {
		Pathname: slime.jrunscript.file.internal.file.Exports["Pathname"]
		spi: any
		api: {
			io: slime.jrunscript.io.Exports
			defined: any
		}
	}

	/**
	 * A Java object representing a filesystem location, analogous to `java.io.File`.
	 */
	type Peer = slime.jrunscript.native.inonit.script.runtime.io.Filesystem.Node

	export interface FilesystemProvider {
		separators: any
		newPathname: (string: string) => slime.jrunscript.file.Pathname
		temporary: any
		java: any
		decorate: any
		peerToString: (peer: Peer) => string
		isRootPath: (path: string) => boolean
		exists: (peer: Peer) => any
		getParent: (peer: Peer) => slime.jrunscript.file.Pathname
		isDirectory: (peer: Peer) => boolean
		createDirectoryAt: (peer: Peer) => void
		read: {
			binary: (peer: Peer) => slime.jrunscript.runtime.io.InputStream
			character: (peer: Peer) => slime.jrunscript.runtime.io.Reader
		}
		write: {
			binary: (peer: Peer, append: boolean) => slime.jrunscript.runtime.io.OutputStream
		}
		getLastModified: (peer: Peer) => Date
		setLastModified: (peer: Peer, date: Date) => void
		remove: (peer: Peer) => void
		move: (peer: Peer, toPathname: slime.jrunscript.file.Pathname) => void
		list: (peer: Peer) => Peer[]
	}

	export interface Exports {
		FilesystemProvider: {
			new (_peer: slime.jrunscript.native.inonit.script.runtime.io.Filesystem): FilesystemProvider
			os: FilesystemProvider
		}
	}

	export type Script = slime.loader.Script<Context,Exports>
}