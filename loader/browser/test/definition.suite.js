var form = $api.Object({ properties: parameters.form.controls });
suite.part("definition", getPartDescriptor({
	definition: form.definition,
	environment: {
		parameters: parameters
	}
}));
