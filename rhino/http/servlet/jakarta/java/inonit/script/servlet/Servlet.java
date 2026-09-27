//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.servlet;

import java.io.*;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

public class Servlet extends HttpServlet {
	private final ServletCore core = new ServletCore(new ServletCore.Adapter() {
		@Override public ClassLoader getClassLoader() {
			return Servlet.class.getClassLoader();
		}

		@Override public Class<?> getServletContextClass() {
			return ServletContext.class;
		}

		@Override public InputStream getResourceAsStream(String path) {
			return Servlet.this.getServletContext().getResourceAsStream(path);
		}

		@Override public Object getServletContext() {
			return Servlet.this.getServletContext();
		}

		@Override public Object getServletConfig() {
			return Servlet.this.getServletConfig();
		}

		@Override public String getPathInfo(Object request) {
			return ((HttpServletRequest)request).getPathInfo();
		}

		@Override public ServletCore.Script adapt(Object script) {
			final Script typed = (Script)script;
			return new ServletCore.Script() {
				@Override public void service(Object request, Object response) {
					typed.service((HttpServletRequest)request, (HttpServletResponse)response);
				}

				@Override public void destroy() {
					typed.destroy();
				}
			};
		}
	});

	public static abstract class Script {
		public abstract void service(HttpServletRequest request, HttpServletResponse response);
		public abstract void destroy();
	}

	static abstract class ScriptContainer extends ServletCore.ScriptContainer {
	}

	public static abstract class HostObject extends ServletCore.HostObject {
		HostObject(ServletCore servlet) {
			super(servlet);
		}
	}

	@Override public final void init() {
		core.init();
	}

	@Override public final void destroy() {
		core.destroy();
	}

	@Override protected final void service(HttpServletRequest request, HttpServletResponse response) {
		core.service(request, response);
	}
}
