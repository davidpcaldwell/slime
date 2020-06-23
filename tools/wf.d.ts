namespace jsh.wf {
	interface Arguments {
		options: {},
		arguments: string[]
	}

	interface Command {
		(p: Arguments): void
	}
}
