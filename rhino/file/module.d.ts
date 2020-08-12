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
		pathname: Pathname,
		remove: () => void,
		parent: Directory,
		move: any
		copy: (pathname: Pathname, mode?: any) => Node
	}

	interface File extends Node {
		read: (any) => any
		length: any
		modified: any
	}

	interface Directory extends Node {
		getRelativePath: (string) => Pathname,
		getFile: (string) => File,
		getSubdirectory: (string) => Directory,
		createTemporary: (p: any) => Node,
		list: Function & { RESOURCE: any }
	}

	interface Searchpath {
	}

	interface Exports {
		Loader: new (p: { directory: Directory, type?: (path: slime.jrunscript.file.File) => slime.MimeType }) => slime.Loader
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
		navigate: (p: any) => any
		Filesystem: any
		Streams: any
		java: any
		zip: any
		unzip: any
	}
}