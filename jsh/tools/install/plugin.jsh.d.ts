namespace slime.jsh.tools.install {
	type Exports = jsh.tools.install.module.Exports & {
		rhino: any
		tomcat: any
	};
}

namespace slime.jsh.shell.tools {
	namespace rhino {
		interface InstallCommand {
			mock?: { lib: slime.jrunscript.file.Directory, rhino: slime.jrunscript.file.File }
			local?: slime.jrunscript.file.File
			replace?: boolean
			version?: string
		}
	}
	interface Exports {
		rhino: {
			install: (
				p?: rhino.InstallCommand,
				events?: any
			) => void
			require: (
				p?: rhino.InstallCommand,
				events?: any
			) => void
		}
		graal: any
		tomcat: any
		ncdbg: any
		kotlin: any
		jsyaml: any
		node: any
		javamail: {
			install: () => void
			require: () => void
		}
		jsoup: any
		postgresql: any
		scala: any
	}
}