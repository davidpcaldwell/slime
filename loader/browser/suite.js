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
};

var data = new $api.Properties({ array: parameters.form.controls }).object();
var add = function(id,part) {
	suite.part(id, part);
};

add("loader/browser/client.js", getSlimePart("loader/browser/client.api.html"));
add("$api/Function", getSlimePart("loader/$api-Function.api.html"));
add("$api/flag", getSlimePart("loader/$api-flag.api.html"));
add("$api", getSlimePart("loader/$api.api.html"));
add("js/object/", getSlimePart("js/object/api.html"));
add("js/object/Error.js", getSlimePart("js/object/Error.api.html"));
add("js/document/", getSlimePart("js/document/api.html"));
add("js/web/", getSlimePart("js/web/api.html"));
add("js/time/", getSlimePart("js/time/api.html"));
// TODO: does js/promise have any real tests?
add("js/promise/", getSlimePart("js/promise/api.html"));

add("loader/api/unit.js", getSlimePart("loader/api/unit.api.html"));
add("loader/api/", getSlimePart("loader/api/api.html"));
add("loader/api/test/data/1/", getSlimePart("loader/api/test/data/1/api.html"));
add("loader/browser/test/", getSlimePart("loader/browser/test/api.html"));
