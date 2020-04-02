namespace slime {
	interface Loader {
		file: any,
		module: any,
		Child: (prefix: string) => Loader,
		get: (path: string) => any
	}
}