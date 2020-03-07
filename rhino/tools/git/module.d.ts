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

			// interface Repository {

			// }

			namespace Installation {
				interface argument {
					program: slime.jrunscript.file.File
				}

				export type daemon = ({port: number, basePath: string, exportAll: boolean}) => { kill: () => void }
			}

			interface Installation {
				daemon: slime.jrunscript.git.Installation.daemon,
				Repository: slime.jrunscript.git.Installation.Repository
			}

			namespace Repository {
				// export interface Local {

				// }

				namespace clone {
					interface argument {
						to: slime.jrunscript.file.Pathname,
						config?: any
					}
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
							repository: any,
							refspec: any,
							config: any
						}
					}

					export type fetch = (p: slime.jrunscript.git.Repository.Local.fetch.argument) => void
				}

				// /**
				//  * @typedef { object } slime.jrunscript.git.Repository.Local
				//  * @property { (p?: any) => slime.jrunscript.git.Repository.Local.Branch[] } branch
				//  * @property { slime.jrunscript.git.Repository.Local.show } show
				//  * @property { slime.jrunscript.git.Repository.Local.fetch } fetch
				//  * @property { slime.jrunscript.git.Repository.Local.merge } merge
				//  * @property { (p: any) => void } checkout
				//  * @property { () => any } status
				//  * @property { any } remote
				//  * @property { any } stash
				//  * @property { Function } push
				//  * @property { Function } mergeBase
				//  * @property { Function } config
				//  */

				interface Local {
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
			}
		}
	}
}