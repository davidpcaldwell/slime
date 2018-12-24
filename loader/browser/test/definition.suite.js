var form = $api.Object({ properties: parameters.form.controls });
var part = getPartDescriptor({
	definition: form.definition,
	environment: {
		parameters: parameters
	}
});
suite.part("definition", part);
if (form.part) {
	var path = part.getPath(form.part.split("/"));
	setPath(["definition"].concat(path));
}
