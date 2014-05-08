//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

package inonit.script.servlet;

import java.io.*;

import javax.servlet.http.*;

import inonit.script.engine.*;

public abstract class Servlet extends javax.servlet.http.HttpServlet {
	static {
		Class[] dependencies = new Class[] {
			//	Pull these in as dependencies, since the Rhino loader depends on them
			inonit.script.runtime.Throwables.class
		};
	}

	private Script script;

	public static abstract class Script {
		public abstract void service(HttpServletRequest request, HttpServletResponse response);
		public abstract void destroy();
	}
	
	protected final Script script() {
		return script;
	}
	
	public abstract void init();

	@Override public final void destroy() {
		script.destroy();
	}

	@Override protected final void service(HttpServletRequest request, HttpServletResponse response) {
		System.err.println("Executing request ...");
		script.service(request, response);
	}

	public abstract class Host {
		private Loader loader;

		Host() {
			this.loader = new inonit.script.engine.Loader() {
				private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();

				@Override public String getLoaderCode(String path) throws IOException {
					return streams.readString(getServletContext().getResourceAsStream("/WEB-INF/loader/" + path));
				}
			};
		}

		public void register(Script script) {
			Servlet.this.script = script;
		}

		public Loader getLoader() {
			return this.loader;
		}
		
		public Servlet getServlet() {
			return Servlet.this;
		}
	}
}