namespace slime.definition.unit {
	namespace Verify {
		type Factory = {
			( scope: slime.definition.verify.Scope ): Verify
		}
	}

	type Verify = slime.definition.verify.Verify & {
		test: Function
		suite: Function
		scope: Function
		scenario: Function
		fire: Function
	}

	interface JSON {
	}
}