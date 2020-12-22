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

	interface Context {
		log: (message: string, p: any) => void,
		api: {
			Promise: () => PromiseConstructorLike & { all: Function, resolve: Function }
		}
	}

	interface Exports {
		Verify: (scope: any, vars?: any) => slime.definition.verify.Verify
		Suite: new (o: any) => { listeners: { add: (type: string, handler: Function) => void }, run: () => void, promise: () => void }
		View: new (o: any) => { on: any }
		getStructure: Function
		Scenario: new () => {}
		TestExecutionProcessor: Function
		JSON: {}
	}
}