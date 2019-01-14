package inonit.script.graal;

import inonit.script.engine.*;

public class HostFactory extends inonit.script.engine.Host.Factory {
	@Override
	public inonit.script.engine.Host.Executor create() {
		//System.err.println("HostFactory.this.create()");
		final org.graalvm.polyglot.Context context = org.graalvm.polyglot.Context.newBuilder("js")
			.option("js.nashorn-compat", "true")
			.allowHostAccess(true)
			.build()
		;

		inonit.script.engine.Host.Executor executor = new inonit.script.engine.Host.Executor() {
			@Override public void set(String name, Object value) {
				context.getBindings("js").putMember(name, value);
			}

			@Override public Object eval(Code.Loader.Resource file) throws javax.script.ScriptException {
				try {
					final org.graalvm.polyglot.Source source = org.graalvm.polyglot.Source.newBuilder("js", file.getReader(), file.getSourceName()).uri(file.getURI().adapt()).build();
					//System.err.println("context = " + context);
					context.enter();
					//System.err.println("current = " + org.graalvm.polyglot.Context.getCurrent());
					Object rv = context.eval(source);
					context.leave();
					return rv;
				} catch (java.io.IOException e) {
					throw new RuntimeException(e);
				}
			}
		};

		return executor;
	}
	
	public static inonit.script.engine.Host create(Loader.Classes.Configuration configuration) {
//		return inonit.script.engine.Host.create(inonit.script.engine.Host.Factory.engine("graal.js"), configuration);
		//System.err.println("HostFactory.create");
		return inonit.script.engine.Host.create(new HostFactory(), configuration);
	}
	
	private HostFactory() {
	}
}
