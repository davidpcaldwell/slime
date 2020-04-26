namespace slime.jrunscript.shell {
	interface Stdio {
		input?: any
		output?: any
		error?: any
	}

	interface Exports {
		//	fires started, exception, stdout, stderr
		embed: (p: {
			method: Function
			argument: object
			started: (p: { output?: string, error?: string }) => boolean
		}, events: $api.Events.Function.Receiver) => void
	}
}