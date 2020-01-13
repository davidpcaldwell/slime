interface jsh {
	loader: any;
	js: any;
	document: any;
	file: any;

	shell: {
		console: (message: string) => void,
		exit: (code: number) => void,
		jsh: any,
		environment: any,
		echo: Function
	};

	script: {
		getopts: Function & { UNEXPECTED_OPTION_PARSER: any },
		file: slime.jrunscript.file.File,
		Application: any
	}
}

declare namespace jsh {
	const http: slime.jrunscript.http.client

	//	TODO	Below probably should be defined in terms of SLIME types, like above
	const js: jsh.js;
	const document: jsh.document;
	const shell: jsh.shell;
	const file: jsh.file;

	//	TODO	investigate whether to define in terms of SLIME
	const loader: jsh.loader;
	const tools: {
		git: any
	}
	namespace unit {
		const mock: slime.jsh.unit.mock
	}

	//	jsh-specific
	const script: jsh.script
}