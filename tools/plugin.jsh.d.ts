namespace jsh.sdlc {
	namespace Exports.requireGitIdentity {
		interface get {
			name: (p: { repository: slime.jrunscript.git.Repository.Local }) => string,
			email: (p: { repository: slime.jrunscript.git.Repository.Local }) => string
		}
	}

	interface Exports {
		requireGitIdentity: ( (p: {
			repository: slime.jrunscript.git.Repository.Local,
			get?: Exports.requireGitIdentity.get
		}) => void) & { get: {
			gui: Exports.requireGitIdentity.get
		} }

		prohibitUntrackedFiles: (p: { repository: slime.jrunscript.git.Repository.Local }, events: $api.Events.Function.Receiver) => void
	}
}