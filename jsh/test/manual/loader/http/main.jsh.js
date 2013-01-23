var module = jsh.script.loader.module("module.js");

jsh.shell.echo([module.property,module.fileProperty].join(" "));
