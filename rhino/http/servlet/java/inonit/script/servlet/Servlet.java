package inonit.script.servlet;

import java.io.*;

import javax.servlet.http.*;

import org.mozilla.javascript.*;

import inonit.script.rhino.*;
import inonit.script.rhino.Code.Source;

public class Servlet extends javax.servlet.http.HttpServlet {
	private Host host = new Host();
	
	@Override public final void init() {
//			Engine.Program program = new Engine.Program();
//
//			Engine.Program.Variable jsh = Engine.Program.Variable.create(
//				"$host",
//				Engine.Program.Variable.Value.create(new Interface())
//			);
//			jsh.setReadonly(true);
//			jsh.setPermanent(true);
//			jsh.setDontenum(true);
//			program.set(jsh);
//
//			Engine.Source jshJs = installation.getJshLoader();
//			if (jshJs == null) {
//				throw new RuntimeException("Could not locate jsh.js bootstrap file using " + installation);
//			}
//			program.add(jshJs);
//			//	TODO	jsh could execute this below
//			program.add(invocation.getScript().getSource());
//			return program;
	}
	
	@Override public final void destroy() {
	}
	
	@Override protected final void service(HttpServletRequest request, HttpServletResponse response) {
	}
	
	public class Host {
		public Scriptable getRhinoLoader() throws IOException {
			return inonit.script.rhino.Loader.load(new inonit.script.rhino.Loader() {
				private inonit.script.runtime.io.Streams streams = new inonit.script.runtime.io.Streams();
				
				@Override public String getPlatformCode() throws IOException {
					return streams.readString(getServletContext().getResourceAsStream("WEB-INF/slime/loader/platform.js"));
				}

				@Override public String getRhinoCode() throws IOException {
					return streams.readString(getServletContext().getResourceAsStream("WEB-INF/slime/loader/rhino.js"));
				}

				@Override public Loader.Classes getClasspath() {
					return Loader.Classes.create(Servlet.class.getClassLoader());
				}

				@Override protected Engine getEngine() {
					throw new UnsupportedOperationException("Not supported yet.");
				}
			});
		}
		
		public InputStream getServletResource(String absolutePath) {
			return getServletConfig().getServletContext().getResourceAsStream(absolutePath);
		}
		
		public String getServletScriptPath() {
			throw new UnsupportedOperationException("Unimplemented.");
		}
	}
}
