namespace slime.jsh.httpd {
	export interface Resources {
		file: any
		add: (m: { directory?: slime.jrunscript.file.Directory, loader?: slime.Loader, prefix: string }) => void
		loader: any
	}

	export namespace resources {
		export type Export = {
			new (): Resources
			Old: any
			NoVcsDirectory: any
			script: any
		}
	}
}