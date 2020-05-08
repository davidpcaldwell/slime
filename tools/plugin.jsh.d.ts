namespace jsh.wf {
	namespace Exports.requireGitIdentity {
		interface get {
			name: (p: { repository: slime.jrunscript.git.Repository.Local }) => string,
			email: (p: { repository: slime.jrunscript.git.Repository.Local }) => string
		}
	}

	interface Context {
		base: slime.jrunscript.file.Directory
	}

	interface Exports {
		project: {
			base: slime.jrunscript.file.Directory
		}

		git: {
			compareTo: (branchName: string) =>
				(repository: slime.jrunscript.git.Repository.Local) => {
					ahead: slime.jrunscript.git.Commit[],
					behind: slime.jrunscript.get.Commit[],
					paths: any
				}
		}

		typescript: {
			tsc: () => void
		}

		requireGitIdentity: ( (p: {
			repository: slime.jrunscript.git.Repository.Local,
			get?: Exports.requireGitIdentity.get
		}, events?: $api.Events.Function.Receiver) => void) & { get: {
			gui: Exports.requireGitIdentity.get
		} }

		prohibitUntrackedFiles: (p: { repository: slime.jrunscript.git.Repository.Local }, events?: $api.Events.Function.Receiver) => void
	}
}