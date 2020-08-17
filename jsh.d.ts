interface jsh {
	java: slime.jrunscript.host.Exports & {
		tools: any,
		log: any
	}

	http: slime.jrunscript.http.client

	tools: {
		git: slime.jrunscript.git.Exports
		hg: any
		node: slime.jrunscript.node.Exports
		install: any
		github: slime.jrunscript.tools.github.Exports
		gradle: any
	} & {
		//	deprecated
		rhino: {}
		tomcat: {}
		ncdbg: {}
	}

	script: jsh.script.Exports

	shell: slime.jrunscript.shell.Exports & jsh.shell.Exports & {
		/** @deprecated */
		getopts: jsh.script["getopts"]
	}

	unit: {
		mock: slime.jsh.unit.mock;
	}

	loader: any
	js: any
	io: any
	document: any
	file: slime.jrunscript.file.Exports
	time: slime.time.Exports
	ip: any
	httpd: jsh.httpd.Exports
}

declare namespace Packages {
	const java: any
	const javax: any
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
	const httpd: jsh['httpd']
}