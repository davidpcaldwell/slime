namespace jsh.plugin {
	const plugin: (p: { isReady: () => boolean, load: () => void }) => void;
}

interface jsh {
	java: slime.jrunscript.host.Exports & {
		tools: any
	};
	http: slime.jrunscript.http.client;

	tools: {
		git: slime.jrunscript.git.Exports,
		hg: any,
		node: slime.jrunscript.node.Exports,
		install: any,
		github: slime.jrunscript.tools.github.Exports
	}

	script: {
		arguments: string[],
		getopts: Function & { UNEXPECTED_OPTION_PARSER: any, ARRAY: any },
		file: slime.jrunscript.file.File,
		Application: any,
		loader: slime.Loader
	};

	shell: slime.jrunscript.shell.Exports & jsh.shell.Exports;

	unit: {
		mock: slime.jsh.unit.mock;
	}

	loader: any;
	js: any;
	io: any;
	document: any;
	file: any;
	time: any;
	ui: any;
	ip: any;
	httpd: jsh.httpd.Exports
}

declare namespace Packages {
	const java: any
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
	const io: jsh['io'];
	const document: jsh['document'];
	const file: jsh['file'];
	const time: jsh['time'];
	const ui: jsh['ui'];
	const ip: jsh['ip'];
	const wf: jsh.wf.Exports;
	const httpd: jsh['httpd']
}