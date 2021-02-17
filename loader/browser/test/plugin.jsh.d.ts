namespace slime.jsh.typescript {
	interface Exports {
		compile: (code: string) => string
	}
}

interface jsh {
	typescript: slime.jsh.typescript.Exports
}