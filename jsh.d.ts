interface jsh {}

declare namespace jsh {
	namespace unit {
		const mock: slime.jsh.unit.mock
	}

	const http: slime.jrunscript.http.client

	const script: {
		getopts: Function
	}
}