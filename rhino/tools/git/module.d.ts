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

				Repository: (p: any) => slime.jrunscript.git.Repository
			}

			interface Repository {
				reference: string,
				clone: (p: slime.jrunscript.git.Repository.clone.argument) => slime.jrunscript.git.Repository.Local
			}

			namespace Repository {
				namespace clone {
					interface argument {
						to: slime.jrunscript.file.Pathname,
						config?: any
					}
				}

				interface Local extends slime.jrunscript.git.Repository {
					directory: slime.jrunscript.file.Directory

					branch: (p?: any) => slime.jrunscript.git.Repository.Local.Branch[],
					show: slime.jrunscript.git.Repository.Local.show,
					fetch: slime.jrunscript.git.Repository.Local.fetch,
					merge: slime.jrunscript.git.Repository.Local.merge,
					checkout: (p: { branch: string, stdio?: any  }) => void,
					status: () => any,
					remote: ( () => void ) & { getUrl: ({ name: string }) => string },
					stash: any,
					push: Function,
					mergeBase: function,
					config: (p: { arguments: string[] }) => object,
					submodule: Function & {
						add: (p: {
							repository: slime.jrunscript.git.Repository,
							path: string
						}) => slime.jrunscript.git.Repository.Local
					}
					log: (p?: { author?: string, all?: boolean, range?: string }) => Commit[]
					execute: (p: {
						command: string
						arguments?: string[]
						environment?: object,
						directory?: slime.jrunscript.file.Directory
					}) => any
				}

				namespace Local {
					interface Branch {
						current: boolean,
						name: string,
						commit: slime.jrunscript.git.Commit
					}

					namespace show {
						interface argument {
							object: string
						}

						interface result {
							names: string[],
							commit: { hash: string },
							author: { name: string, email: string, date: any },
							committer: { name: string, email: string, date: any },
							subject: string
						}
					}

					export type show = (p: slime.jrunscript.git.Repository.Local.show.argument) => slime.jrunscript.git.Repository.Local.show.result

					namespace merge {
						interface argument {
							name: string,
							ff_only?: boolean
							stdio?: any
						}
					}

					export type merge = (p: slime.jrunscript.git.Repository.Local.merge.argument) => void;

					namespace fetch {
						interface argument {
							all?: boolean,
							prune?: boolean,
							stdio?: any
						}
					}

					export type fetch = (p: slime.jrunscript.git.Repository.Local.fetch.argument) => void
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