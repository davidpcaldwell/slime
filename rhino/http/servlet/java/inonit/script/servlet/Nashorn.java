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
import inonit.script.nashorn.*;

class Nashorn extends Servlet.ScriptContainer {
	private Servlet servlet;
	private Host host;

	@Override void initialize(Servlet servlet) {
		this.servlet = servlet;
		this.host = Host.create(new Loader.Classes.Configuration() {
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
		host.set(name, value);
	}

	@Override void addScript(final String name, final InputStream stream) {
		host.add(new Code.Source.File() {
			@Override public Code.Source.URI getURI() {
				throw new UnsupportedOperationException();
			}

			@Override public String getSourceName() {
				return name;
			}

			//	TODO	implement?
			@Override public java.util.Date getLastModified() {
				return null;
			}

			//	TODO	implement?
			@Override public Long getLength() {
				return null;
			}

			@Override public InputStream getInputStream() {
				return stream;
			}
		});
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
		private Host host;

		HostObject(Servlet servlet, Host host) {
			super(servlet);
			this.host = host;
		}

		public String getCoffeeScript() throws IOException {
			return getLoader().getCoffeeScript();
		}

		public Loader.Classes.Interface getClasspath() {
			return host.getClasspath();
		}
	}
}