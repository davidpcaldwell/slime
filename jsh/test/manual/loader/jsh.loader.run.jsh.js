jsh.loader.run(jsh.script.file.parent.getRelativePath("jsh.loader.run.js"), {
    value: void(0),
    setValue: function(v) {
        jsh.shell.console("value = " + v);
    }
});
jsh.loader.run(jsh.script.file.parent.getRelativePath("jsh.loader.run.js"), {
    setValue: function(v) {
        jsh.shell.console("value = " + v);
    }
});
