package inonit.script.servlet;

import java.io.*;

import javax.servlet.http.*;

import inonit.script.rhino.*;

public class Servlet extends javax.servlet.http.HttpServlet {
	private Host host = new Host();
	
	@Override public final void init() {
	}
	
	@Override public final void destroy() {
	}
	
	@Override protected final void service(HttpServletRequest request, HttpServletResponse response) {
	}
	
	public class Host {
		public InputStream getServletContainerResourceAsStream(String absolutePath) {
			return getServletConfig().getServletContext().getResourceAsStream(absolutePath);
		}
	}
}
