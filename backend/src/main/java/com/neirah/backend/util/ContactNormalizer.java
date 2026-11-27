package com.neirah.backend.util;

import java.util.Locale;

/**
 * Single place for contact normalisation used by duplicate detection,
 * search and customer matching.
 */
public final class ContactNormalizer {

    private ContactNormalizer() {
    }

    /** Trim + lower-case. Blank values become null so they never match anything. */
    public static String email(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /** Digits only. Values without any digits become null. */
    public static String phone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        String digits = phone.replaceAll("[^0-9]", "");
        return digits.isBlank() ? null : digits;
    }
}
