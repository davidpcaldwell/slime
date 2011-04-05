var UNZIP_RHINO_WHEN_PACKAGING = true;

var parameters = jsh.script.getopts({
	options: {
		jsh: jsh.file.Pathname
		,script: jsh.file.Pathname
		//	module format is name=pathname
		,module: jsh.script.getopts.ARRAY(String)
		,library: jsh.script.getopts.ARRAY(jsh.file.Pathname)
		,directory: false
		,to: jsh.file.Pathname
	}
});

var slime = jsh.loader.script(jsh.script.getRelativePath("slime.js")).slime;

var compile = function(args) {
	Packages.javax.tools.ToolProvider.getSystemJavaCompiler().run(
		Packages.java.lang.System["in"],
		Packages.java.lang.System.out,
		Packages.java.lang.System.err,
		jsh.java.toJavaArray( args, Packages.java.lang.String, function(x) { return new java.lang.String(x) } )
	);
}

var to = (function() {
	if (parameters.options.directory) return parameters.options.to.createDirectory({ ifExists: function(d) { d.remove(); return true; }, recursive: true });
	return jsh.file.filesystems.os.Pathname(String(jsh.shell.properties.java.io.tmpdir)).directory.createTemporary({ directory: true });
})();

var JSH = parameters.options.jsh.directory;

if (UNZIP_RHINO_WHEN_PACKAGING) {
	jsh.file.unzip({ zip: JSH.getFile("lib/js.jar"), to: to });
}
to.getRelativePath("$jsh/rhino.jar").write(JSH.getFile("lib/js.jar").read(jsh.file.Streams.binary), { recursive: true });

jsh.file.unzip({ zip: JSH.getFile("jsh.jar"), to: to });
to.getRelativePath("$jsh/api.rhino.js").write(JSH.getFile("script/launcher/api.rhino.js").read(String), { recursive: true });
to.getRelativePath("$jsh/jsh.rhino.js").write(JSH.getFile("script/launcher/jsh.rhino.js").read(String), { recursive: true });

jsh.file.unzip({ zip: JSH.getFile("lib/jsh.jar"), to: to });

to.getRelativePath("$jsh/loader.js").write(JSH.getFile("script/platform/literal.js").read(String), { recursive: true });
to.getRelativePath("$jsh/rhino.js").write(JSH.getFile("script/rhino/literal.js").read(String), { recursive: true });
to.getRelativePath("$jsh/jsh.js").write(JSH.getFile("script/jsh/jsh.js").read(String), { recursive: true });

JSH.getSubdirectory("modules").list().forEach( function(module) {
	var tokens = module.pathname.basename.split(".");
	tokens = tokens.slice(0,tokens.length-1);
	var destination = to.getRelativePath("$jsh/modules/" + tokens.join("/")).createDirectory({ recursive: true });
	jsh.file.unzip({ zip: module, to: destination });
} );

var libraries = [].concat(parameters.options.library);
libraries.forEach( function(library,index) {
	to.getRelativePath("$libraries/" + String(index) + ".jar").write( library.file.read(jsh.file.Streams.binary), { recursive: true });
} );

parameters.options.module.forEach( function(module) {
	var tokens = module.split("=");
	var name = tokens[0];
	var pathname = jsh.file.Pathname(tokens[1]);
	if (pathname.directory) {
		slime.build.jsh(pathname.directory,to.getRelativePath("$modules/" + name).createDirectory({recursive: true}
));
	} else {
		throw "Unimplemented: bundle slime format module.";
	}
} );

to.getRelativePath("main.jsh").write(parameters.options.script.file.read(jsh.file.Streams.binary));

if (!parameters.options.directory) {
	jsh.file.zip({ from: to.pathname, to: parameters.options.to });
}