namespace jsh.plugin {
	interface $slime extends slime.jrunscript.runtime.Exports {
		getSystemProperty(name: string): string
		getEnvironment(): any
		getInvocation(): any
		getPackaged(): any

		plugins: {
			mock: jsh.loader.plugins.Export["mock"]
		}

		loader: any
		getLibraryFile: any
		getInterface(): any
		getSystemProperties(): any
	}
}