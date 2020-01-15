interface jsh {
	loader: any;
	js: any;
	java: slime.jrunscript.host.Exports;
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
	};

	tools: {
		git: any,
		node: slime.jrunscript.node.Exports
	}
}

declare namespace jsh {
	const http: slime.jrunscript.http.client

	//	jsh-specific
	//	Indexed access properties; see https://www.typescriptlang.org/docs/handbook/advanced-types.html#index-types
	const java: jsh['java'];
	const tools: jsh['tools'];
	const script: jsh['script'];

	//	TODO	Below probably should be defined in terms of SLIME types, like above
	const js: jsh.js;
	const document: jsh.document;
	const shell: jsh.shell;
	const file: jsh.file;

	//	TODO	investigate whether to define in terms of SLIME
	const loader: jsh.loader;

	namespace unit {
		const mock: slime.jsh.unit.mock
	}
}