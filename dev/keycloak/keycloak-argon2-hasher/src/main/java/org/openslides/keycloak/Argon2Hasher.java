package org.openslides.keycloak;

import org.bouncycastle.crypto.params.Argon2Parameters;
import org.bouncycastle.crypto.generators.Argon2BytesGenerator;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

public class Argon2Hasher {
    private static final int SALT_LENGTH = 16; // Recommended length for salt
    private static final int HASH_LENGTH = 32; // Desired hash length in bytes
    private static final int ITERATIONS = 3;   // Number of iterations
    private static final int MEMORY = 65536;   // Memory in KiB (64 MB)
    private static final int PARALLELISM = 1;  // Degree of parallelism

    // Generate a random salt
    private static byte[] generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[SALT_LENGTH];
        random.nextBytes(salt);
        return salt;
    }

    // Hash a password with Argon2
    public static String hashPassword(String password) {
        byte[] salt = generateSalt();

        Argon2Parameters.Builder builder = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                .withSalt(salt)
                .withParallelism(PARALLELISM)
                .withMemoryAsKB(MEMORY)
                .withIterations(ITERATIONS);

        Argon2BytesGenerator generator = new Argon2BytesGenerator();
        generator.init(builder.build());

        byte[] hash = new byte[HASH_LENGTH];
        generator.generateBytes(password.getBytes(StandardCharsets.UTF_8), hash);

        // Encode salt and hash as Base64 for storage
        return Base64.getEncoder().encodeToString(salt) + "$" + Base64.getEncoder().encodeToString(hash);
    }

    // Verify a password against a stored hash
    public static boolean verifyPassword(String password, String storedHash) {
        String[] parts = storedHash.split("\\$");
        byte[] salt = Base64.getDecoder().decode(parts[0]);
        byte[] storedHashBytes = Base64.getDecoder().decode(parts[1]);

        Argon2Parameters.Builder builder = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                .withSalt(salt)
                .withParallelism(PARALLELISM)
                .withMemoryAsKB(MEMORY)
                .withIterations(ITERATIONS);

        Argon2BytesGenerator generator = new Argon2BytesGenerator();
        generator.init(builder.build());

        byte[] hash = new byte[HASH_LENGTH];
        generator.generateBytes(password.getBytes(StandardCharsets.UTF_8), hash);

        return java.util.Arrays.equals(hash, storedHashBytes);
    }

    public static void main(String[] args) {
        String password = "MySecurePassword";
        String hash = hashPassword(password);

        System.out.println("Password Hash: " + hash);
        System.out.println("Password Verified: " + verifyPassword(password, hash));
    }
}
