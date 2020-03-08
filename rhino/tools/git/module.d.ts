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

			namespace Installation {
				interface argument {
					program: slime.jrunscript.file.File
				}

				export type daemon = ({port: number, basePath: string, exportAll: boolean}) => { kill: () => void }
				export type Repository = (p: any) => slime.jrunscript.git.Repository;
			}

			interface Installation {
				daemon: slime.jrunscript.git.Installation.daemon,
				Repository: slime.jrunscript.git.Installation.Repository
			}

			interface Repository {
				reference: string,
				clone: (p: slime.jrunscript.git.Repository.clone.argument) => slime.jrunscript.git.LocalRepository
			}

			namespace Repository {
				namespace clone {
					interface argument {
						to: slime.jrunscript.file.Pathname,
						config?: any
					}
				}

				interface Local extends slime.jrunscript.git.Repository {
					branch: (p?: any) => slime.jrunscript.git.Repository.Local.Branch[],
					show: slime.jrunscript.git.Repository.Local.show,
					fetch: slime.jrunscript.git.Repository.Local.fetch,
					merge: slime.jrunscript.git.Repository.Local.merge,
					checkout: (p: any) => void,
					status: () => any,
					remote: any,
					stash: any,
					push: Function,
					mergeBase: function,
					config: Function
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
							prune?: boolean
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
				Installation: (environment: slime.jrunscript.git.Installation.argument) => slime.jrunscript.git.Installation,
				credentialHelper: any,
				installation: slime.jrunscript.git.Installation,
				install: Function & { GUI: any },
				Repository: slime.jrunscript.git.Installation.Repository
			}
		}
	}
}