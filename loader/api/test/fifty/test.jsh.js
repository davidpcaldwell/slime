//@ts-check
(function() {
	var definition = {};
	jsh.script.loader.run("module.d.ts", {
		$loader: jsh.script.loader,
		verify: function(b) {
			if (!b) throw new Error("Failed.");
			jsh.shell.console("Success!");
		},
		$exports: definition
	});
	jsh.shell.console(Object.keys(definition).join(","));
	definition.Database();
})();
