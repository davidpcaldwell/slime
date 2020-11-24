type mockjshplugin = (p: {
	global?: { [x: string]: any }
	jsh?: { [x: string]: any }
	plugins?: { [x: string]: any }
}) => ReturnType<jsh.loader.plugins.Export["mock"]>

namespace slime.fifty {
	interface Exports {
		ast: (p: { node: { script: slime.jrunscript.file.Pathname, debug?: boolean }, ast: slime.jrunscript.file.Pathname, file: slime.jrunscript.file.Pathname }) => object

		interpret: (p: { ast: object }) => object
	}

	namespace test {
		type verify = slime.definition.verify.Verify

		type $loader = slime.Loader & {
			getRelativePath: any,
			/**
			 * Present if Fifty is being run in a `jsh` shell; provides the ability to load `jsh` plugins into a mock shell.
			 */
			jsh?: {
				plugin: {
					/**
					 * Allows a test to load `jsh` plugins into a mock shell. Loads plugins from the same directory as the
					 * shell, optionally specifying the global object, `jsh`, and the shared `plugins` object used by the jsh plugin
					 * loader.
					 */
					mock: mockjshplugin
				}
			}
		}

		interface run {
			(f: () => void, name: string): void
			(f: () => void): void
		}

		type tests = any

		interface load {
			<T>(path: string, part: string, t: T): (t: T) => void
			<T>(path: string, part?: string): () => void
		}

		interface kit {
			verify: verify
			$loader: $loader
			run: run
			tests: tests
			load: load
			global: {
				jsh?: jsh
				window?: Window
			}
		}
	}

	namespace test.internal {
		interface Console {
			start: (scope: Scope, name: string) => void
			test: (scope: Scope, message: string, result: boolean) => void
			end: (scope: Scope, name: string, result: boolean) => void
		}

		interface Scope {
			success: boolean

			depth(): number
			fail(): void

			start: (name: string) => void
			test: slime.definition.verify.Scope["test"]
			end: (name: string, result: boolean) => void
		}

		type run = (loader: slime.fifty.test.$loader, path: string, part?: string) => boolean
	}
}