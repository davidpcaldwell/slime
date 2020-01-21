interface jsh {
	java: slime.jrunscript.host.Exports;
	http: slime.jrunscript.http.client;

	tools: {
		git: any,
		node: slime.jrunscript.node.Exports,
		install: any
	}

	script: {
		getopts: Function & { UNEXPECTED_OPTION_PARSER: any },
		file: slime.jrunscript.file.File,
		Application: any
	};

	shell: {
		console: (message: string) => void,
		exit: (code: number) => void,
		jsh: any,
		environment: any,
		echo: Function,
		run: Function,
		HOME: slime.jrunscript.file.Directory,
		PATH: any,
		browser: any
	};

	unit: {
		mock: slime.jsh.unit.mock;
	}

	loader: any;
	js: any;
	document: any;
	file: any;
	time: any;
}

declare namespace jsh {
	//	Indexed access properties; see https://www.typescriptlang.org/docs/handbook/advanced-types.html#index-types

	const java: jsh['java'];
	const http: jsh['http'];

	const tools: jsh['tools'];
	const script: jsh['script'];
	const shell: jsh['shell'];
	const unit: jsh['unit'];

	const loader: jsh['loader'];
	const js: jsh['js'];
	const document: jsh['document'];
	const file: jsh['file'];
	const time: jsh['time'];
}