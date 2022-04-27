namespace slime.project.openapi {
	export interface Context {
	}

	export interface Exports {
		initialize: (jsh: slime.jsh.Global) => {
			src: slime.jrunscript.file.Directory
			node: slime.jrunscript.node.Installation
		}
	}

	export interface Plugin {
		initialize: () => {
			src: slime.jrunscript.file.Directory
			node: slime.jrunscript.node.Installation
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
