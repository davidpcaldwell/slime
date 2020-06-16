namespace slime.jrunscript.file {
	interface Pathname {
		directory: Directory,
		parent: Pathname,
		createDirectory: (p?: { exists?: (d: Directory) => boolean, recursive?: boolean } ) => Directory,
		write: (any,any?) => any,
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
		Loader: new (p: { directory: Directory }) => slime.Loader
		Pathname: (p: string) => Pathname
		Searchpath: (pathnames: slime.jrunscript.file.Pathname[]) => Searchpath
	}
}