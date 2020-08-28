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
}