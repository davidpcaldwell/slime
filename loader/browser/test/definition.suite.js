var form = $api.Object({ properties: parameters.form.controls });
var part = getPartDescriptor({
	definition: form.definition,
	environment: {
		parameters: parameters
	},
	part: form.part
});
suite.part("definition", part);
