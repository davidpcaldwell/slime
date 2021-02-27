namespace slime.jsh.$fifty {
	interface Exports {
		plugin: {
			mock: jsh.loader.plugins.Export["mock"]
		}
	}
}

namespace slime.jsh {
	interface Global {
		$fifty: slime.jsh.$fifty.Exports
	}
}

