suite.add(
	"definition",
	new jsh.unit.html.Part({
		name: "definition",
		pathname: definition,
		environment: {
			parameters: parameters
		},
		reload: false
	})
)