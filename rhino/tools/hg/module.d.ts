namespace slime.jrunscript.hg {
	interface Commit {
		changeset: {
			local: number
			global: string
		},
		user: string
		summary: string
		date: Date
	}

	interface Repository {
	}

	namespace Repository {
		interface Remote extends slime.jrunscript.hg.Repository {
			url: any
		}

		interface Local extends slime.jrunscript.hg.Repository {
			directory: slime.jrunscript.file.Directory
			identify: Function
			heads: () => any
			log: (p?: any) => Commit[]
			subrepositories: () => { [path: string]: { repository: slime.jrunscript.hg.Repository.Local, revision: string } }
			subrepositories: ({ array: boolean }) => slime.jrunscript.hg.Repository.Local[]
			paths: {
				default: {
					url: any
					directory: slime.jrunscript.file.Directory
				}
			}
		}
	}

	interface Hgrc {
		get: (name?: string) => string | object;
		set: (section: string, name: string, value: string) => void;
		normalize: () => void;
		write: () => void;
	}

	interface Exports {
		Hgrc: new (p: { file: slime.jrunscript.file.File }) => Hgrc
	}
}