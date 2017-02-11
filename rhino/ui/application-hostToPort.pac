function FindProxyForURL(url, host) {
	if (host == "__HOST__") return "PROXY 127.0.0.1:__PORT__";
	return "DIRECT";
}

