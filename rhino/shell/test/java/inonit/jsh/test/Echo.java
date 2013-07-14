package inonit.jsh.test;

public class Echo {
	public static void main(String[] args) throws java.io.IOException {
		int b;
		while( (b = System.in.read()) != -1) {
			System.out.write((int)b);
		}
		System.out.flush();
	}
}
