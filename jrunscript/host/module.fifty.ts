namespace slime.jrunscript.host {
	export interface Context {
		$slime: any
		globals: any
	}

	export interface Exports {
		getClass: Function
		isJavaObject: any
		isJavaType: any
		toNativeClass: any
		Array: any
		invoke: any
		Properties: any
		fail: any
		ErrorType: any
		toJsArray: any
		toJavaArray: any
		Thread: any
		Environment: any
		addShutdownHook: any
	}
}