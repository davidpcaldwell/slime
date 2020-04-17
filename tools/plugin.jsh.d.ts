namespace jsh.sdlc {
	namespace Exports.requireGitIdentity {
		interface get {
			name: (p: { repository: slime.jrunscript.git.Repository.Local }) => string,
			email: (p: { repository: slime.jrunscript.git.Repository.Local }) => string
		}

		interface argument {
			repository: slime.jrunscript.git.Repository.Local,
			get?: Exports.requireGitIdentity.get
		}
	}

	interface Exports {
		requireGitIdentity: ( (p: Exports.requireGitIdentity.argument) => void) & { get: any }
		prohibitUntrackedFiles: (p: { repository: slime.jrunscript.git.Repository.Local }, events: $api.Events.Function.Receiver) => void
	}
}