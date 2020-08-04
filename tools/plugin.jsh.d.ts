interface jsh {
	$fifty: {
		plugin: {
			mock: any
		}
	}
	wf: jsh.wf.Exports
}

$loader.run("plugin.jsh.fifty.ts", {
	jsh: jsh,
	verify: verify,
	run: run,
	tests: tests,
	$loader: $loader
});
