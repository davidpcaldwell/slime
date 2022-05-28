namespace slime.jrunscript.tools.profiler.viewer {
	export interface JavaCode {
		className: string
		methodName: string
		signature: string
	}

	export interface JavascriptCode {
		sourceName: string
		lineNumber?: number
		lineNumbers?: number[]
		functionName?: string
	}

	export interface SelfCode {
		self: Code
	}

	export type Code = JavaCode | JavascriptCode | SelfCode

	export interface Node {
		code: Code
		statistics: {
			count: number
			elapsed: number
		}
		children: Node[]
		self: SelfCode
	}

	export interface Profile {
		thread: {
			name: string
		}
		timing: {
			root: Node
		}
	}

	export interface Settings {
		threshold: number
	}
}
