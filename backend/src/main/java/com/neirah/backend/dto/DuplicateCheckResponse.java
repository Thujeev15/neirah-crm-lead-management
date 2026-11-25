package com.neirah.backend.dto;

import java.util.List;

public record DuplicateCheckResponse(
        boolean duplicateFound,
        List<LeadResponse> matches
) {
}
