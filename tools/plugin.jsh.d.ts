namespace jsh.sdlc {
	interface Exports {
		requireGitIdentity: ( (p: {
			repository: slime.jrunscript.git.Repository.Local,
			get?: {
				name: (p: { repository: slime.jrunscript.git.Repository.Local }) => string,
				email: (p: { repository: slime.jrunscript.git.Repository.Local }) => string
			}
		}) => void) & { get: any }
	}
}