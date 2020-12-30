package inonit.script.rhino;

import java.io.*;
import java.util.*;

import org.mozilla.javascript.*;

public class Program {
	private ArrayList<Variable> variables = new ArrayList<Variable>();
	private ArrayList<Unit> units = new ArrayList<Unit>();

	public void set(Variable variable) {
		variables.add( variable );
	}

	private static class ObjectName {
		static final ObjectName NULL = new ObjectName();

		void set(Context context, Scriptable global, Variable variable) {
			ScriptableObject.defineProperty(
				global,
				variable.getName(),
				variable.getValue(context, global),
				variable.getRhinoAttributes()
			);
		}

		Scriptable get(Context context, Scriptable global, boolean create) {
			return global;
		}
	}

	public void add(Source source) {
		units.add( new SourceUnit(ObjectName.NULL, source) );
	}

	// public void add(Function function, Object[] arguments) {
	// 	units.add( new FunctionUnit(function, arguments) );
	// }

	public void add(Unit unit) {
		units.add(unit);
	}

	static class Outcome {
		private Object result;

		Outcome(Object result) {
			this.result = result;
		}

		Object getResult() {
			return result;
		}
	}

	void setVariablesInGlobalScope(Context context, Scriptable global) {
		for (int i=0; i<variables.size(); i++) {
			Variable v = variables.get(i);
			Object value = v.value.get(context, global);

			//	Deal with dumb Rhino restriction that we use object arrays only
			if (value instanceof Object[]) {
				Object[] array = (Object[])value;
				Object[] objects = new Object[array.length];
				for (int j=0; j<objects.length; j++) {
					objects[j] = array[j];
				}
				value = context.newArray( global, objects );
			}

			v.set(context, global);
		}
	}

	private Outcome execute(Debugger dim, Context context, Scriptable global) throws IOException {
		if (context == null) {
			throw new RuntimeException("'context' is null");
		}
		Object result = null;
		for (int i=0; i<units.size(); i++) {
			Errors errors = Errors.get(context);
			if (errors != null) {
				errors.reset();
			}
			try {
				result = units.get(i).execute(dim, context, global);
			} catch (WrappedException e) {
				//	TODO	Note that when this is merged into jsh, we will need to change jsh error reporting to dump the
				//			stack trace from the contained Throwable inside the errors object.
//					throw e;
				if (errors != null) {
					errors.add(e);
					throw errors;
				} else {
					throw e;
				}
			} catch (EvaluatorException e) {
				//	TODO	Oh my goodness, is there no better way to do this?
				if (errors != null && (e.getMessage().indexOf("Compilation produced") == -1 || e.getMessage().indexOf("syntax errors.") == -1)) {
					errors.add(e);
				}
				if (errors != null) {
					throw errors;
				} else {
					throw e;
				}
			} catch (EcmaError e) {
				if (errors != null) {
					errors.add(e);
					throw errors;
				} else {
					throw e;
				}
			} catch (JavaScriptException e) {
				if (errors != null) {
					errors.add(e);
					throw errors;
				} else {
					throw e;
				}
			}
		}
		return new Outcome(result);
	}

	Outcome interpret(Debugger dim, Context context, Scriptable global) throws IOException {
		if (context == null) {
			throw new RuntimeException("'context' is null");
		}
		return execute(dim, context, global);
	}

	public static class Variable {
		public static Variable create(String name, Value value) {
			return new Variable(ObjectName.NULL, name, value, new Attributes());
		}

		private ObjectName scope;
		private String name;
		private Value value;
		private Attributes attributes;

		Variable(ObjectName scope, String name, Value value, Attributes attributes) {
			this.scope = scope;
			this.name = name;
			this.value = value;
			this.attributes = attributes;
		}

		String getName() {
			return name;
		}

		Object getValue(Context context, Scriptable scope) {
			return value.get(context, scope);
		}

		int getRhinoAttributes() {
			return attributes.toRhinoAttributes();
		}

		void set(Context context, Scriptable global) {
			scope.set(context, global, this);
		}

		public void setPermanent(boolean permanent) {
			attributes.permanent = permanent;
		}

		public void setReadonly(boolean readonly) {
			attributes.readonly = readonly;
		}

		public void setDontenum(boolean dontenum) {
			attributes.dontenum = dontenum;
		}

		public static abstract class Value {
			public static Value create(final Object o) {
				return new Value() {
					public Object get(Context context, Scriptable scope) {
						return Context.javaToJS(o, scope);
					}
				};
			}

			public abstract Object get(Context context, Scriptable scope);
		}

		public static class Attributes {
			public static Attributes create() {
				return new Attributes();
			}

			private boolean permanent;
			private boolean readonly;
			private boolean dontenum;

			private Attributes() {
			}

			int toRhinoAttributes() {
				int rv = ScriptableObject.EMPTY;
				if (permanent) rv |= ScriptableObject.PERMANENT;
				if (readonly) rv |= ScriptableObject.READONLY;
				if (dontenum) rv |= ScriptableObject.DONTENUM;
				return rv;
			}
		}
	}

	public static abstract class Unit {
		protected abstract Object execute(Debugger dim, Context context, Scriptable global) throws IOException;
	}

	private static class SourceUnit extends Unit {
		private ObjectName scope;
		private Source source;

		SourceUnit(ObjectName scope, Source source) {
			this.scope = scope;
			this.source = source;
		}

		protected Object execute(Debugger dim, Context context, Scriptable global) throws IOException {
			Scriptable executionScope = scope.get(context, global, true);
//				Script script = source.compile(dim, context);
//				Object rv = script.exec(context, executionScope);
//				return rv;
			return source.evaluate(dim, context, executionScope, executionScope, true);
		}
	}
}
