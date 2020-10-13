namespace slime.jrunscript.runtime.io {
	interface InputStream {
		close()
		character(mode?: any): Reader
		java: {
			adapt(): Packages.java.io.InputStream
			array(): any
		}
	}

	interface Reader {
		close()
		asString(): string
	}

	interface Context {
		_streams: Packages.inonit.script.runtime.io.Streams
		api: {
			java: slime.jrunscript.host.Exports
			Resource: any
		}
	}

	interface Exports {
		OutputStream: any
		Writer: any
		InputStream: new (p: Packages.java.io.InputStream) => InputStream
		Reader: any
		Streams: any
		Buffer: any
	}
}
