namespace slime.definition.unit {
	type Verify = {
		(value: any, name?: string): any

		scenario: Function

		//	deprecated below here
		test: Function
		fire: Function
		scope: any,
		suite: Function
	}

	interface JSON {
	}
}