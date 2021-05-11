namespace slime.jsh.$fifty {
	//	TODO	should be making this available as part of Fifty object
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

