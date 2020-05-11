namespace slime {
	namespace jrunscript {
		namespace git {
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
				init: (p: { pathname: slime.jrunscript.file.Pathname }, events?: object) => slime.jrunscript.git.Repository.Local

				daemon: (p: {
					port?: number
					basePath?: slime.jrunscript.file.Pathname
					exportAll?: boolean
				}) => Daemon

				Repository: {
					(p: { remote: string }): slime.jrunscript.git.Repository
					new (p: { remote: string }): slime.jrunscript.git.Repository
					(p: { directory: slime.jrunscript.file.Directory }): slime.jrunscript.git.Repository.Local
					new (p: { directory: slime.jrunscript.file.Directory }): slime.jrunscript.git.Repository.Local
					(p: { local: slime.jrunscript.file.Directory }): slime.jrunscript.git.Repository.Local
					new (p: { local: slime.jrunscript.file.Directory }): slime.jrunscript.git.Repository.Local
				}
			}

			interface Repository {
				reference: string,
				clone: (p: {
					to: slime.jrunscript.file.Pathname,
					recurseSubmodules?: boolean
				} & Repository.argument, events?: object ) => slime.jrunscript.git.Repository.Local
			}

			namespace Repository {
				interface argument {
					config?: { [x: string]: string }
					credentialHelper?: string
					directory?: slime.jrunscript.file.Directory
				}

				interface Local extends slime.jrunscript.git.Repository {
					directory: slime.jrunscript.file.Directory

					branch: (p?: {
						remote?: boolean
						all?: boolean
					}) => slime.jrunscript.git.Repository.Local.Branch[]

					branch: (p: {
						old: boolean
					}) => slime.jrunscript.git.Repository.Local.Branch

					branch: (p: {
						name: string
						startPoint?: string
						force?: boolean
					}) => void

					branch: (p: {
						delete: string
						force: boolean
					}) => void

					show: (p: { object: string}  ) => Commit

					fetch: (p: {
						all?: boolean
						prune?: boolean
						recurseSubmodules?: boolean
						stdio?: any
					}) => void

					merge: (p: {
						name: string
						noCommit?: boolean
						ffOnly?: boolean
						stdio?: any
					}) => void

					checkout: (p: { branch: string, stdio?: any  }) => void

					status: () => { branch: Branch, paths?: { [path: string]: any }},

					remote: ( () => void ) & { getUrl: ({ name: string }) => string },
					stash: any,
					push: Function,
					mergeBase: (p: { commits: string[] }) => Commit,
					config: (p: { arguments: string[] }) => object,
					submodule: Function & {
						add: (p: {
							repository: slime.jrunscript.git.Repository,
							path: string
						}) => slime.jrunscript.git.Repository.Local,
						update: any
					}

					log: (p?: {
						author?: string
						all?: boolean
						revisionRange?: string, /* deprecated name */ range?: string
					}) => Commit[]

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

			interface Context {
				program: slime.jrunscript.file.File,
				api: any
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
	}
}