var src = jsh.script.file.parent.parent;
jsh.shell.jsh({
	shell: src,
	script: src.getFile("jsh/tools/ncdbg.jsh.js"),
	//	TODO	switch to function(list)
	// arguments: function(list) {
	// 	list.push("-ncdbg:chrome:instance", src.getRelativePath("local/chrome/ncdbg.jsh.js"))
	// }
	arguments: [
		"-ncdbg:chrome:instance", src.getRelativePath("local/chrome/ncdbg.jsh.js")
	]
});
