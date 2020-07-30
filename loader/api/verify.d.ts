namespace slime.definition.verify {
	type Verify = {
		(value: any, name?: string): any
	}

	namespace Scope {
		type Test = {
			(): { success: boolean, message: string }
		}
	}

	interface Scope {
		test: (f: Scope.Test) => void
	}

	type Factory = {
		( scope: Scope ): Verify
	}

	interface Exports {
		Verify: Factory
	}
}