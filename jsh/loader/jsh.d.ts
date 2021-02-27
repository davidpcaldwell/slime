namespace slime.jsh.plugin {
	interface EngineSpecific {
		//	provided by engine-specific rhino.js and nashorn.js
		exit: any
		jsh: any
	}

	interface Stdio {
		getStandardInput(): slime.jrunscript.native.java.io.InputStream
		getStandardOutput(): slime.jrunscript.native.java.io.PrintStream
		getStandardError(): slime.jrunscript.native.java.io.PrintStream
	}

	interface $slime extends slime.jrunscript.runtime.Exports, EngineSpecific {
		getSystemProperty(name: string): string
		getEnvironment(): slime.jrunscript.native.inonit.system.OperatingSystem.Environment
		getInvocation(): any

		getPackaged(): slime.jrunscript.native.inonit.script.jsh.Shell.Packaged

		plugins: {
			mock: jsh.loader.plugins.Export["mock"]
		}

		loader: {
			getLoaderScript(path: string): any
		}
		getLibraryFile: any
		getInterface(): any
		getSystemProperties(): slime.jrunscript.native.java.util.Properties
		getStdio(): Stdio
	}
}