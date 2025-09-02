//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.servlet;

import java.io.*;

import javax.script.*;

import inonit.script.engine.*;

class Nashorn extends Servlet.ScriptContainer {
	private Servlet servlet;
	private Loader.Classes classes;

	@Override void initialize(Servlet servlet) {
		this.servlet = servlet;
		this.classes = Loader.Classes.create(
			getLoaderClassesConfiguration()
		);
	}

	@Override Servlet.HostObject getServletHostObject() {
		return new HostObject(servlet,classes);
	}

	@Override void execute(inonit.script.engine.Host.Program program) {
		try {
			inonit.script.engine.Host.run(
				inonit.script.engine.Host.Factory.engine("nashorn"),
				classes,
				program
			);
		} catch (ScriptException e) {
			throw new RuntimeException(e);
		}
	}

	//	TODO	could be removed and superclass could be made concrete
	public static class HostObject extends Servlet.HostObject {
		private Loader.Classes classes;

		HostObject(Servlet servlet, Loader.Classes classes) {
			super(servlet);
			this.classes = classes;
		}

		public Loader.Classes.Interface getClasspath() {
			return classes.getInterface();
		}
	}
}
