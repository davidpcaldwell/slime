namespace slime {
	export namespace project.wf {
		export interface Interface extends slime.jsh.wf.standard.Interface {
			initialize: slime.jsh.wf.cli.Command
			hello: slime.jsh.wf.cli.Command
			git: any
			merge: any
		}
	}
}