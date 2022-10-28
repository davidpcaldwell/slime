//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.hg {
	export interface Commit {
		changeset: {
			local: number
			global: string
		},
		user: string
		summary: string
		date: Date
	}

	export interface Repository {
	}

	export namespace Repository {
		export interface Remote extends slime.jrunscript.tools.hg.Repository {
			url: any
		}

		export interface Local extends slime.jrunscript.tools.hg.Repository {
			directory: slime.jrunscript.file.Directory
			identify: Function
			heads: () => any
			log: (p?: any) => Commit[]
			subrepositories: {
				(): { [path: string]: { repository: slime.jrunscript.tools.hg.Repository.Local, revision: string } }
				(p: { array: boolean }): slime.jrunscript.tools.hg.Repository.Local[]
			}
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
