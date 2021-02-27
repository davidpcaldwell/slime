namespace slime.jsh.typescript {
	interface Exports {
		compile: (code: string) => string
	}
}

namespace slime.jsh {
	interface Global {
		typescript: slime.jsh.typescript.Exports
	}
}
