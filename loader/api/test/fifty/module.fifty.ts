namespace slime.fifty {
	export interface Exports {
		ast: (p: { node: { script: slime.jrunscript.file.Pathname, debug?: boolean }, ast: slime.jrunscript.file.Pathname, file: slime.jrunscript.file.Pathname }) => object

		interpret: (p: { ast: object }) => object
	}

	export namespace test {
		/** @deprecated Duplicative of {@link slime.definition.verify.Verify}. */
		export type verify = slime.definition.verify.Verify

		export type $loader = slime.Loader & {
			//	will return a Pathname in jsh, but what in browser?
			getRelativePath: (p: string) => any

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
					mock: (p: {
						global?: { [x: string]: any }
						jsh?: { [x: string]: any }
						plugins?: { [x: string]: any }
						$slime?: slime.jsh.plugin.$slime
					}) => ReturnType<slime.jsh.loader.internal.plugins.Export["mock"]>
				},
				$slime: jsh.plugin.$slime
			}
		}

		export interface run {
			(f: () => void, name: string): void
			(f: () => void): void
		}

		export type tests = any

		export interface load {
			<T>(path: string, part: string, t: T): (t: T) => void
			<T>(path: string, part?: string): () => void
		}

		export interface kit {
			verify: verify
			$loader: $loader
			run: run
			tests: tests
			load: load
			global: {
				jsh?: slime.jsh.Global
				window?: Window
			},
			$api: {
				Function: slime.$api.Global["Function"]
				Events: {
					/**
					 * Creates an [[$api.Events.Handler]] that captures and stores all received [[$api.Event]]s for querying.
					 */
					Captor: <T>(t: T) => {
						events: $api.Event<any>[],
						handler: Required<$api.Events.Handler<T>>
					}
				}
			},
			jsh?: {
				$slime: jsh.plugin.$slime
				file: {
					location: () => slime.jrunscript.file.Pathname
					directory: () => slime.jrunscript.file.Directory
				}
			}
		}

		export namespace internal {
			export interface Console {
				start: (scope: Scope, name: string) => void
				test: (scope: Scope, message: string, result: boolean) => void
				end: (scope: Scope, name: string, result: boolean) => void
			}

			export interface Scope {
				success: boolean

				depth(): number
				fail(): void

				start: (name: string) => void
				test: slime.definition.verify.Context
				end: (name: string, result: boolean) => void
			}

			export type run = (loader: slime.fifty.test.$loader, path: string, part?: string) => boolean
		}
	}
}