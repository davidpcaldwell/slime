package inonit.script.rhino;

import java.util.*;

import org.mozilla.javascript.*;

public class Program {
	private ArrayList<Variable> variables = new ArrayList<Variable>();
	private ArrayList<Source> units = new ArrayList<Source>();

	public void set(Variable variable) {
		variables.add( variable );
	}

	final List<Variable> variables() {
		return variables;
	}

	public void add(Source source) {
		units.add( source );
	}

	final List<Source> sources() {
		return units;
	}

	public static class Variable {
		public static Variable create(String name, Engine.Value value) {
			return new Variable(name, value, new Attributes());
		}

		private String name;
		private Engine.Value value;
		private Attributes attributes;

		Variable(String name, Engine.Value value, Attributes attributes) {
			this.name = name;
			this.value = value;
			this.attributes = attributes;
		}

		Engine.Value value() {
			return value;
		}

		String getName() {
			return name;
		}

		int getRhinoAttributes() {
			return attributes.toRhinoAttributes();
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
}
