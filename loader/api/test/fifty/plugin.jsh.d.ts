namespace slime.jsh.$fifty {
	interface Exports {
		plugin: {
			mock: slime.jsh.loader.internal.plugins.Export["mock"]
		}
	}
}

namespace slime.jsh {
	interface Global {
		$fifty: slime.jsh.$fifty.Exports
	}
}

