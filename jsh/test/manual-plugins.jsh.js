var exception = function() {
	try {
		throw new Error("Don't break");
	} catch (e) {
	}
};

var e2 = jsh.debug.disableBreakOnExceptionsFor(exception);

//	should break
debugger;
exception();
//	should not break
debugger;
e2();

debugger;
//	Check for jsh.http, which currently should load in unbuilt shell because we search from public/slime/ for plugin.jsh.js
