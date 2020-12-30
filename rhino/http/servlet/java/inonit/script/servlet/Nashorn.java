//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.servlet;

import java.io.*;

import javax.script.*;

import inonit.script.engine.*;

class Nashorn extends Servlet.ScriptContainer {
	private Servlet servlet;
	private inonit.script.engine.Host host;

	@Override void initialize(Servlet servlet) {
		this.servlet = servlet;
		this.host = inonit.script.engine.Host.create(inonit.script.engine.Host.Factory.engine("nashorn"), new Loader.Classes.Configuration() {
			@Override public boolean canCreateClassLoaders() {
				return true;
			}

			@Override public ClassLoader getApplicationClassLoader() {
				return Nashorn.class.getClassLoader();
			}

			@Override public File getLocalClassCache() {
				return null;
			}
		});
	}

	@Override Servlet.HostObject getServletHostObject() {
		return new HostObject(servlet,host);
	}

	@Override void setVariable(String name, Object value) {
		host.bind(Host.Binding.create(name, value));
	}

	@Override void addScript(Code.Loader.Resource resource) {
		try {
			host.script(Host.Script.create(resource));
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	@Override void execute() {
		try {
			host.run();
		} catch (ScriptException e) {
			throw new RuntimeException(e);
		}
	}

	//	TODO	could be removed and superclass could be made concrete
	public static class HostObject extends Servlet.HostObject {
		private inonit.script.engine.Host host;

		HostObject(Servlet servlet, inonit.script.engine.Host host) {
			super(servlet);
			this.host = host;
		}

		public Loader.Classes.Interface getClasspath() {
			return host.getClasspath();
		}
	}
}