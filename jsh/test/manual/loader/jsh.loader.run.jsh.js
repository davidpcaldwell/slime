//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

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
