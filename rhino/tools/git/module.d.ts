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
				}
			}
		}
	}
}