import java.io.*;

public class Stdio {
	public static void main(String[] args) throws IOException {
		System.err.print("Does this appear in the parent error stream? ");

		BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
		System.out.println(reader.readLine());
	}
}