namespace slime.fifty {
	interface Exports {
		ast: (p: { node: { script: slime.jrunscript.file.Pathname, debug?: boolean }, ast: slime.jrunscript.file.Pathname, file: slime.jrunscript.file.Pathname }) => object

		interpret: (p: { ast: object }) => object
	}

	namespace test {
		type verify = slime.definition.verify.Verify

		type $loader = slime.Loader & { getRelativePath: any }

		interface run {
			(f: () => void, name: string): void
			(f: () => void): void
		}

		type tests = any
	}

	namespace test.internal {
		interface Console {
			start: (depth: number, name: string) => void
			test: (depth: number, message: string) => void
			end: (depth: number, name: string, result: boolean) => void
		}

		interface Scope {
			success: boolean

			depth(): number
			fail(): void

			start: (name: string) => void
			test: slime.definition.verify.Scope["test"]
			end: (name: string, result: boolean) => void
		}
	}
}