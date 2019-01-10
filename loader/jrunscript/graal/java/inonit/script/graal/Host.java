package inonit.script.graal;

import inonit.script.engine.*;

public class Host {
	public static inonit.script.engine.Host create(Loader.Classes.Configuration configuration) {
		return inonit.script.engine.Host.create(configuration, "nashorn");
	}
	
	private Host() {
	}
}
