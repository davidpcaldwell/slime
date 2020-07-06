namespace $api {
	namespace TypeScript {
		type UnsafeCast<T> = <T>(v: any) => T
	}
}

namespace jsh.script {
	interface Invocation {
		options: { [x: string]: any }
		arguments: string[]
		[x: string]: any
	}

	interface Exports {
		arguments: string[]
		getopts: Function & { UNEXPECTED_OPTION_PARSER: any, ARRAY: any }
		file?: slime.jrunscript.file.File
		script?: any
		/** @deprecated */
		pathname: any
		/** @deprecated */
		url?: any
		/** @deprecated */
		addClasses: any
		getRelativePath: any
		Application: any
		loader: slime.Loader
		Loader?: any
	}
}