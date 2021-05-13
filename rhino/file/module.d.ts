namespace slime.jrunscript.file {
	interface Pathname {
		directory: Directory
		basename: string
		parent: Pathname
		createDirectory: (p?: { exists?: (d: Directory) => boolean, recursive?: boolean } ) => Directory
		write: (any,any?) => any
		file: File
		java: {
			adapt: () => Packages.java.io.File
		}
	}

	interface Node {
		pathname: Pathname
		directory: boolean
		remove: () => void,
		parent: Directory,
		move: any
		copy: (
			pathname: Pathname | Directory,
			mode?: {
				filter?: (p: {
					entry: {
						path: string
						node: slime.jrunscript.file.Node
					},
					exists: slime.jrunscript.file.Node
				}) => boolean

				recursive?: any
			}
		) => Node
	}

	interface File extends Node {
		read: (any) => any
		length: any
		modified: Date
	}

	interface Directory extends Node {
		getRelativePath: (string) => Pathname,
		getFile: (string) => File,
		getSubdirectory: (string) => Directory,
		createTemporary: {
			(p: { directory: true, prefix?: string, suffix?: string }): Directory
			(p?: { directory?: false, prefix?: string, suffix?: string }): File
		}
		list: {
			(mode?: {
				type?: any
				filter?: any
				descendants?: any

				/** @deprecated */
				recursive?: any
			}): any
			RESOURCE: any
			ENTRY: any
		}
	}

	interface Searchpath {
		getCommand: any
	}

	interface Exports {
		//	TODO	would be nice to get rid of string below, but right now it's unknown exactly how to access MimeType from
		//			jsh/browser/servlet environments
		Loader: new (p: { directory: Directory, type?: (path: slime.jrunscript.file.File) => (slime.MimeType | string) }) => slime.Loader
		Pathname: {
			(p: string): Pathname
			createDirectory: any
		}
		Searchpath: {
			(pathnames: slime.jrunscript.file.Pathname[]): Searchpath
			createEmpty: any
		}
		filesystem: any
		filesystems: any
		navigate: (p: { from: Pathname | Node, to: Pathname | Node, base?: Directory }) => { base: Directory, relative: string }
		Filesystem: any
		Streams: any
		java: any
		zip: any
		unzip: any
	}
}