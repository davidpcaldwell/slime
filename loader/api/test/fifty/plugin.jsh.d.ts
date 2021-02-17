namespace slime.jsh.$fifty {
	interface Exports {
		plugin: {
			mock: jsh.loader.plugins.Export["mock"]
		}
	}
}

interface jsh {
	$fifty: slime.jsh.$fifty.Exports
}
