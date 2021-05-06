namespace slime.jsh.tools.install.module {
	export interface Homebrew {
		directory: any
		update: () => void
		install: (p: { formula: string }) => void
		upgrade: (p: { formula: string }) => void
	}

	export namespace homebrew {
		export interface Exports {
			get: (p: { location: slime.jrunscript.file.Pathname }) => Homebrew
		}

		export type Factory = slime.loader.Product<{},homebrew.Exports>
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
			}
		}
	//@ts-ignore
	)(fifty);
}

