var parameters = jsh.script.getopts({
    options: {
        message: "(unspecified)"
    }
});

//  TODO    why does kotlin.io not work?
jsh.loader.kotlin.run(jsh.script.file.parent.getFile("kotlin.kts"), {
    bindings: {
        message: parameters.options.message
    }
});
