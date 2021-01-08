namespace jsh.plugin {
	interface EngineSpecific {
		//	provided by engine-specific rhino.js and nashorn.js
		exit: any
		jsh: any
	}

	interface Stdio {
		getStandardInput(): Packages.java.io.InputStream
		getStandardOutput(): Packages.java.io.PrintStream
		getStandardError(): Packages.java.io.PrintStream
	}

	interface $slime extends slime.jrunscript.runtime.Exports, EngineSpecific {
		getSystemProperty(name: string): string
		getEnvironment(): any
		getInvocation(): any

		getPackaged(): Packages.inonit.script.jsh.Shell.Packaged

		plugins: {
			mock: jsh.loader.plugins.Export["mock"]
		}

		loader: {
			getLoaderScript(path: string): any
		}
		getLibraryFile: any
		getInterface(): any
		getSystemProperties(): any
		getStdio(): Stdio
	}
}