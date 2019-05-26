var parameters = jsh.script.getopts({
    options: {
        replace: false
    }
});
jsh.shell.tools.kotlin.install(parameters.options, {
    console: function(e) {
        jsh.shell.console(e.detail);
    }
});
