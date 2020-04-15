namespace slime.jrunscript.hg {
	interface Commit {
		changeset: {
			local: number
			global: string
		},
		summary: string
	}

	interface Repository {
	}

	namespace Repository {
		interface Local extends slime.jrunscript.hg.Repository {
			identify: Function
			log: (p: any) => Commit[]
			paths: {
				default: {
					url: any
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