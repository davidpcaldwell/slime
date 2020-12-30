package inonit.script.rhino;

import java.util.*;

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

		Attributes attributes() {
			return attributes;
		}

		public void setPermanent(boolean permanent) {
			attributes.configurable(!permanent);
		}

		public void setReadonly(boolean readonly) {
			attributes.writable(!readonly);
		}

		public void setDontenum(boolean dontenum) {
			attributes.enumerable(!dontenum);
		}

		public static class Attributes {
			public static Attributes create() {
				return new Attributes();
			}

			private boolean configurable;
			private boolean writable;
			private boolean enumerable;

			private Attributes() {
			}

			public boolean configurable() {
				return this.configurable;
			}

			public boolean writable() {
				return this.writable;
			}

			public boolean enumerable() {
				return this.enumerable;
			}

			Attributes configurable(boolean configurable) {
				this.configurable = configurable;
				return this;
			}

			Attributes writable(boolean writable) {
				this.writable = writable;
				return this;
			}

			Attributes enumerable(boolean enumerable) {
				this.enumerable = enumerable;
				return this;
			}
		}
	}
}
