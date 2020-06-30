namespace slime.definition.verify {
	type Verify = {
		(value: any, name?: string): any

		scenario: Function

		//	deprecated below here
		test: Function
		fire: Function
		scope: any,
		suite: Function
	}

	type ScopeTest = {
		(): { success: boolean, message: string }
	}

	interface Scope {
		success: boolean
		test: (f: ScopeTest) => void
	}

	type Factory = {
		( scope: slime.definition.verify.Scope ): slime.definition.unit.Verify
	}

	interface Exports {
		Verify: Factory
	}
}