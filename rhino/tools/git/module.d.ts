namespace slime.jrunscript.git {
	interface Commit {
		names: string[],
		commit: { hash: string },
		author: { name: string, email: string, date: any },
		committer: { name: string, email: string, date: any },
		subject: string
	}

	interface Branch {
		current: boolean,
		name: string,
		commit: Commit
	}

	interface Daemon {
		port: number
		basePath?: slime.jrunscript.file.Pathname
		kill: () => void
	}

	namespace Installation {
		interface argument {
			program: slime.jrunscript.file.File
		}
	}

	interface Installation {
		daemon: (p: {
			port?: number
			basePath?: slime.jrunscript.file.Pathname
			exportAll?: boolean
		}) => Daemon

		Repository: {
			(p: { directory: slime.jrunscript.file.Directory }): slime.jrunscript.git.Repository.Local
			new (p: { directory: slime.jrunscript.file.Directory }): slime.jrunscript.git.Repository.Local
			(p: { local: slime.jrunscript.file.Directory }): slime.jrunscript.git.Repository.Local
			new (p: { local: slime.jrunscript.file.Directory }): slime.jrunscript.git.Repository.Local
			(p: { remote: string }): slime.jrunscript.git.Repository
			new (p: { remote: string }): slime.jrunscript.git.Repository
		}

		//	Uses Object.assign for rhino/shell run(), so should cross-check with those arguments
		execute: (m: {
			config?: any
			command: string,
			arguments?: string[]
			environment?: any
			directory?: slime.jrunscript.file.Directory
		}) => void
	}

	interface Repository {
		reference: string,
		clone: (argument: Repository.argument & {
			to: slime.jrunscript.file.Pathname,
			recurseSubmodules?: boolean
		}, events?: object ) => slime.jrunscript.git.Repository.Local
	}

	interface Submodule {
		/**
		 * The logical name of the submodule, as it is referenced in configuration entries.
		 */
		name: string

		/**
		 * The path of the submodule within its parent.
		 */
		path: string

		/**
		 * The branch the submodule is set up to track, if it is set up to track one.
		 */
		branch?: string

		repository: Repository.Local
		commit: Commit
	}

	namespace Repository {
		interface argument {
			config?: { [x: string]: string }
			credentialHelper?: string
			directory?: slime.jrunscript.file.Directory
		}

		interface Local extends slime.jrunscript.git.Repository {
			directory: slime.jrunscript.file.Directory

			add: any
			rm: (p: { path: string }, events?: $api.Events.Function.Receiver) => void

			branch: {
				(p: {
					delete: string
					force?: boolean
				}): void

				(p?: {
					remote?: boolean
					all?: boolean
				}): slime.jrunscript.git.Branch[]

				(p: {
					old: boolean
				}): slime.jrunscript.git.Branch

				(p: {
					name: string
					startPoint?: string
					force?: boolean
				}): void
			}

			show: (p: { object: string}  ) => Commit

			fetch: (p: {
				all?: boolean
				prune?: boolean
				recurseSubmodules?: boolean
				stdio?: any
			}, events?: $api.Events.Function.Receiver) => void

			merge: (p: {
				name: string
				noCommit?: boolean
				ffOnly?: boolean
				stdio?: any
			}) => void

			checkout: (p: { branch: string, stdio?: any  }) => void

			status: () => { branch: Branch, paths?: { [path: string]: string }},

			remote: ( () => void ) & { getUrl: ({ name: string }) => string },
			stash: any,
			push: (p?: {
				delete?: boolean
				setUpstream?: string
				all?: boolean
				repository?: string
				refspec?: string

				config?: any
				environment?: any
			}) => void,
			mergeBase: (p: { commits: string[] }) => Commit
			submodule: {
				/**
				 * Returns a list of submodules for this repository.
				 */
				(p?: { cached?: boolean }): Submodule[]

				add: (p: {
					repository: slime.jrunscript.git.Repository
					path: string
					name?: string
					branch?: string
				}) => slime.jrunscript.git.Repository.Local

				update: (p: argument & {
					init?: boolean,
					recursive?: boolean
				}) => void

				deinit: (p: argument & {
					force?: boolean
					path: string
				}) => void
			}

			execute: (p: {
				command: string
				arguments?: string[]
				environment?: object,
				directory?: slime.jrunscript.file.Directory
			}) => any

			commit: (p: {
				all?: boolean
				noVerify?: boolean
				message: string
				author?: string
			}) => any
		}
	}

	namespace internal {
		interface Environment {
			[x: string]: string
		}

		interface InvocationConfiguration<T> {
			arguments?: (p: T) => $api.Function.impure.Updater<string[]>
			environment?: (p: T) => $api.Function.impure.Updater<Environment>,
			createReturnValue?: (p: T) => (result: Result) => any
		}

		interface GitCommand<T> {
			name: string
			configure: <S extends T>(p: T) => InvocationConfiguration<S>
		}

		interface Result {
			output: {
				stdout: string[]
				stderr: string[]
			}

			//	TODO	this should be the datatype returned by rhino/shell.run(), which is currently not declared
			result: {
				status: number
			}
		}

		interface Command {
			name: string
		}
	}

	interface Context {
		program: slime.jrunscript.file.File,
		api: {
			js: any
			java: any
			shell: slime.jrunscript.shell.Exports
			Error: any
			time: slime.time.Exports
		}
		environment: any
		console: any
	}

	interface Exports {
		Installation: (environment: slime.jrunscript.git.Installation.argument) => slime.jrunscript.git.Installation
		credentialHelper: any
		installation: slime.jrunscript.git.Installation
		daemon: slime.jrunscript.git.Installation["daemon"]
		Repository: slime.jrunscript.git.Installation["Repository"]
		init: slime.jrunscript.git.Installation["init"]
		execute: slime.jrunscript.git.Installation["execute"]
		install: Function & { GUI: any }
	}
}