namespace slime.runtime.old {
	export interface Context {
		globals: boolean
	}

	export interface Exports {
		undefined: void
		defined: any
		constant: any
		lazy: any
		toLiteral: any
		ObjectTransformer: any
		properties: any
		Object: any
		Filter: any
		Map: any
		Order: any
		Array: any
		Error: any
		Task: any

		Function: $api["Function"]

		/**
		 * @deprecated
		 */
		deprecate: $api["deprecate"]
	}
}