// TODO: rename to api.suite.js to tie more explicitly to api.html?

if (parameters.form) {
	for (var i=0; i<parameters.form.controls.length; i++) {
		if (parameters.form.controls[i].name == "migrate") {
			working = false;
		}
	}
}

var getSlimePart = function(definition) {
	return getPartDescriptor({
		definition: "../../../../" + definition
	});
}

suite.part("loader/browser/client.js", getSlimePart("loader/browser/client.api.html"));
suite.part("$api", getSlimePart("loader/$api.api.html"));
suite.part("js/object/", getSlimePart("js/object/api.html"));
suite.part("js/object/Error.js", getSlimePart("js/object/Error.api.html"));
suite.part("js/document/", getSlimePart("js/document/api.html"));
suite.part("js/web/", getSlimePart("js/web/api.html"));
suite.part("js/time/", getSlimePart("js/time/api.html"));
// TODO: does js/promise have any real tests?
suite.part("js/promise/", getSlimePart("js/promise/api.html"));

suite.part("loader/api/unit.js", getSlimePart("loader/api/unit.api.html"));
suite.part("loader/api/", getSlimePart("loader/api/api.html"));
suite.part("loader/api/test/data/1/", getSlimePart("loader/api/test/data/1/api.html"));
suite.part("loader/browser/test/", getSlimePart("loader/browser/test/api.html"));
