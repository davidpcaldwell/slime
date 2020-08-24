namespace jsh.tools.install.module {
	interface Context {
		client?: any
		api: {
			shell: any
			file: any
			http: any
		}
		downloads: any
	}

	interface Exports {
		format: any
		get: any
		install: (p: {
			name?: string,
			getDestinationPath?: (file: slime.jrunscript.file.File) => string,
			url?: any,
			file?: slime.jrunscript.file.File,
			format?: any,
			to: slime.jrunscript.file.Pathname,
			replace?: boolean
		}, events?: $api.Events.Function.Receiver) => slime.jrunscript.file.Directory
		gzip: any
		zip: any
		apache: any
		$api: any
	}
}