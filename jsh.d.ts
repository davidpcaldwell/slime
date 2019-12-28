interface jsh {}

declare namespace jsh {
	namespace unit {
		const mock: slime.jsh.unit.mock
	}

	const http: slime.jrunscript.http.client

	const script: {
		getopts: Function,
		file: slime.jrunscript.file.File
	}

	const shell: {
		console: (message: string) => void,
		exit: (code: number) => void,
		jsh: any
	}

	const tools: {
		git: any
	}
}