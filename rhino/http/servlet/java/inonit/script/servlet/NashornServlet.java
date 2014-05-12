package inonit.script.servlet;

import java.io.*;

import inonit.script.nashorn.*;

public class NashornServlet extends Servlet {
	private static class Nashorn extends ScriptContainer {
//		private Host host = new Host();
		
		@Override
		void initialize(Servlet servlet) {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		@Override
		Host getServletHostObject() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		@Override
		void setVariable(String name, Object value) {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		@Override
		void addScript(String name, InputStream stream) {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}

		@Override
		void execute() {
			throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
		}
	}
	
	@Override protected ScriptContainer createScriptContainer() {
		return new Nashorn();
	}
	
	private static class HostObject extends Servlet.HostObject {
		HostObject(Servlet servlet) {
			super(servlet);
		}
	}
}
