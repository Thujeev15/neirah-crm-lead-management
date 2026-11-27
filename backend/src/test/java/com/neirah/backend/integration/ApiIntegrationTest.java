package com.neirah.backend.integration;

import com.neirah.backend.entity.*;
import com.neirah.backend.repository.*;
import com.neirah.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end tests through the real security filter chain, controllers,
 * services and an in-memory H2 database.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private UserRepository userRepository;
    @Autowired private LeadRepository leadRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private ActivityRepository activityRepository;
    @Autowired private FollowUpRepository followUpRepository;

    private User manager;
    private User rep;
    private User otherRep;

    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        // leads.customer_id -> customers and customers.lead_id -> leads reference each other,
        // so break the lead side first.
        jdbcTemplate.update("UPDATE leads SET customer_id = NULL");
        customerRepository.deleteAll();
        followUpRepository.deleteAll();
        activityRepository.deleteAll();
        auditLogRepository.deleteAll();
        leadRepository.deleteAll();
        userRepository.deleteAll();

        manager = user("manager@test.local", Role.MANAGER);
        rep = user("rep@test.local", Role.SALES_REP);
        otherRep = user("other@test.local", Role.SALES_REP);
    }

    private User user(String email, Role role) {
        User u = new User();
        u.setEmail(email);
        u.setFullName(email);
        u.setPasswordHash(passwordEncoder.encode("Password123"));
        u.setRole(role);
        return userRepository.save(u);
    }

    private Lead lead(User owner, LeadStatus status, String email) {
        Lead l = new Lead();
        l.setName("Lead " + email);
        l.setEmail(email);
        l.setEmailNormalized(email);
        l.setPriority(Priority.MEDIUM);
        l.setStatus(status);
        l.setCreatedBy(owner);
        l.setOwner(owner);
        if (status == LeadStatus.WON) {
            l.setDealValue(new BigDecimal("1000.00"));
        }
        return leadRepository.save(l);
    }

    private String bearer(User u) {
        User current = userRepository.findByEmail(u.getEmail()).orElseThrow();
        return "Bearer " + jwtService.generateToken(current.getEmail(), current.getTokenVersion());
    }

    @Test
    void unauthenticatedRequestReturns401WithJsonError() throws Exception {
        mockMvc.perform(get("/api/v1/leads"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value("/api/v1/leads"));
    }

    @Test
    void frameworkClientErrorsKeepTheirStatusInsteadOf500() throws Exception {
        mockMvc.perform(get("/api/v1/does-not-exist").header("Authorization", bearer(manager)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        mockMvc.perform(delete("/api/v1/leads/1").header("Authorization", bearer(manager)))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(post("/api/v1/leads").header("Authorization", bearer(manager))
                        .contentType(MediaType.TEXT_PLAIN).content("x"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void salesRepCannotAccessManagerOnlyEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/users/sales-reps").header("Authorization", bearer(rep)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(get("/api/v1/users/sales-reps").header("Authorization", bearer(manager)))
                .andExpect(status().isOk());
    }

    @Test
    void salesRepCannotViewOrModifyAnotherRepsLead() throws Exception {
        Lead othersLead = lead(otherRep, LeadStatus.NEW, "x@client.test");

        mockMvc.perform(get("/api/v1/leads/" + othersLead.getId())
                        .header("Authorization", bearer(rep)))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/leads/" + othersLead.getId() + "/status")
                        .header("Authorization", bearer(rep))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONTACTED\"}"))
                .andExpect(status().isForbidden());

        assertEquals(LeadStatus.NEW, leadRepository.findById(othersLead.getId()).orElseThrow().getStatus());
    }

    @Test
    void repeatedConversionCreatesExactlyOneCustomer() throws Exception {
        Lead won = lead(rep, LeadStatus.WON, "won@client.test");
        String url = "/api/v1/leads/" + won.getId() + "/convert";

        MvcResult first = mockMvc.perform(post(url).header("Authorization", bearer(rep)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyConverted").value(false))
                .andReturn();

        MvcResult second = mockMvc.perform(post(url).header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyConverted").value(true))
                .andReturn();

        String firstId = first.getResponse().getContentAsString().replaceAll(".*\"customerId\":(\\d+).*", "$1");
        String secondId = second.getResponse().getContentAsString().replaceAll(".*\"customerId\":(\\d+).*", "$1");
        assertEquals(firstId, secondId);
        assertEquals(1, customerRepository.count());
    }

    @Test
    void nonWonLeadCannotBeConverted() throws Exception {
        Lead open = lead(rep, LeadStatus.PROPOSAL_SENT, "open@client.test");

        mockMvc.perform(post("/api/v1/leads/" + open.getId() + "/convert")
                        .header("Authorization", bearer(rep)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("WON")));

        assertEquals(0, customerRepository.count());
    }

    @Test
    void duplicateEmailWarnsBeforeCreationAndRequiresConfirmation() throws Exception {
        lead(rep, LeadStatus.NEW, "dup@client.test");
        String body = "{\"name\":\"Dup\",\"email\":\"DUP@Client.TEST\",\"priority\":\"LOW\"}";

        mockMvc.perform(post("/api/v1/leads/check-duplicates")
                        .header("Authorization", bearer(rep))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duplicateFound").value(true));

        mockMvc.perform(post("/api/v1/leads")
                        .header("Authorization", bearer(rep))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());

        assertEquals(1, leadRepository.count());
    }

    @Test
    void invalidRequestReturnsFieldValidationErrors() throws Exception {
        mockMvc.perform(post("/api/v1/leads")
                        .header("Authorization", bearer(rep))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.priority").exists());
    }

    @Test
    void wonWithoutDealValueIsRejectedAndNoAuditIsWritten() throws Exception {
        Lead proposal = lead(rep, LeadStatus.PROPOSAL_SENT, "p@client.test");

        mockMvc.perform(put("/api/v1/leads/" + proposal.getId() + "/status")
                        .header("Authorization", bearer(rep))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"WON\",\"dealValue\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("deal value")));

        assertEquals(0, auditLogRepository.count());
    }

    @Test
    void dashboardSummaryIsScopedByRole() throws Exception {
        lead(rep, LeadStatus.WON, "a@client.test");
        lead(rep, LeadStatus.NEW, "b@client.test");
        lead(otherRep, LeadStatus.NEW, "c@client.test");

        mockMvc.perform(get("/api/v1/dashboard/summary").header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalLeads").value(3))
                .andExpect(jsonPath("$.countsByStage.WON").value(1));

        mockMvc.perform(get("/api/v1/dashboard/summary").header("Authorization", bearer(rep)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalLeads").value(2))
                .andExpect(jsonPath("$.conversionRate").value(50.0))
                // Win rate = Won / closed. The rep has 1 Won and 0 Lost.
                .andExpect(jsonPath("$.winRate").value(100.0));
    }

    @Test
    void missingLeadReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/leads/999999").header("Authorization", bearer(manager)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void followUpOnClosedLeadIsRejectedByServer() throws Exception {
        Lead won = lead(rep, LeadStatus.WON, "closed@client.test");
        String tomorrow = java.time.LocalDateTime.now().plusDays(1).withNano(0).toString();

        mockMvc.perform(post("/api/v1/leads/" + won.getId() + "/follow-ups")
                        .header("Authorization", bearer(rep))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CALL\",\"title\":\"Check in\",\"dueAt\":\"" + tomorrow + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Won or Lost")));

        assertEquals(0, followUpRepository.count());
    }

    // ---------------------------------------------------------------
    // Review fixes
    // ---------------------------------------------------------------

    private FollowUp followUp(Lead lead, User assignee, String title, java.time.LocalDateTime completedAt) {
        FollowUp f = new FollowUp();
        f.setLead(lead);
        f.setCreatedBy(assignee);
        f.setAssignedTo(assignee);
        f.setType(FollowUpType.CALL);
        f.setTitle(title);
        f.setDueAt(java.time.LocalDateTime.now().minusDays(1));
        f.setCompletedAt(completedAt);
        return followUpRepository.save(f);
    }

    @Test
    void reassignmentMovesOpenFollowUpsToNewOwnerAndKeepsCompletedHistory() throws Exception {
        Lead lead = lead(otherRep, LeadStatus.CONTACTED, "move@client.test");
        FollowUp open = followUp(lead, otherRep, "Open task", null);
        FollowUp done = followUp(lead, otherRep, "Done task", java.time.LocalDateTime.now().minusHours(1));

        mockMvc.perform(put("/api/v1/leads/" + lead.getId() + "/assign")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ownerEmail\":\"rep@test.local\"}"))
                .andExpect(status().isOk());

        assertEquals(rep.getId(), followUpRepository.findById(open.getId()).orElseThrow().getAssignedTo().getId());
        assertEquals(otherRep.getId(), followUpRepository.findById(done.getId()).orElseThrow().getAssignedTo().getId());

        mockMvc.perform(get("/api/v1/follow-ups?status=OVERDUE").header("Authorization", bearer(rep)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Open task"))
                .andExpect(jsonPath("$[0].assignedToName").value("rep@test.local"));
    }

    @Test
    void salesRepAccountsCanOnlyBeCreatedByManagers() throws Exception {
        String body = "{\"fullName\":\"New Rep\",\"email\":\"new@test.local\",\"password\":\"Password123\"}";

        // Public self-registration no longer exists.
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/users/sales-reps").header("Authorization", bearer(rep))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/users/sales-reps").header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("new@test.local"));

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"new@test.local\",\"password\":\"Password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("SALES_REP"));
    }

    @Test
    void searchIsOrderedNewestFirstAndMatchesPhoneDigits() throws Exception {
        Lead first = lead(rep, LeadStatus.NEW, "first@client.test");
        Lead second = lead(rep, LeadStatus.NEW, "second@client.test");
        Lead third = lead(rep, LeadStatus.NEW, "third@client.test");
        third.setPhone("077-100-0003");
        third.setPhoneNormalized("0771000003");
        leadRepository.save(third);

        mockMvc.perform(get("/api/v1/leads/search?page=0&size=2").header("Authorization", bearer(rep)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.leads[0].id").value(third.getId()))
                .andExpect(jsonPath("$.leads[1].id").value(second.getId()))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/api/v1/leads/search?page=1&size=2").header("Authorization", bearer(rep)))
                .andExpect(jsonPath("$.leads[0].id").value(first.getId()));

        mockMvc.perform(get("/api/v1/leads/search?search=0771000003").header("Authorization", bearer(rep)))
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.leads[0].id").value(third.getId()));
    }

    @Test
    void secondWonLeadForSameEmailLinksToExistingCustomerAndRecordsConversion() throws Exception {
        Lead firstDeal = lead(rep, LeadStatus.WON, "buyer@client.test");
        Lead secondDeal = lead(rep, LeadStatus.WON, "BUYER@client.test");

        mockMvc.perform(post("/api/v1/leads/" + firstDeal.getId() + "/convert").header("Authorization", bearer(rep)))
                .andExpect(jsonPath("$.linkedToExistingCustomer").value(false));

        mockMvc.perform(post("/api/v1/leads/" + secondDeal.getId() + "/convert").header("Authorization", bearer(rep)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linkedToExistingCustomer").value(true))
                .andExpect(jsonPath("$.leadId").value(secondDeal.getId()))
                .andExpect(jsonPath("$.sourceLeadId").value(firstDeal.getId()));

        assertEquals(1, customerRepository.count());

        mockMvc.perform(get("/api/v1/leads/" + secondDeal.getId() + "/audit-logs").header("Authorization", bearer(rep)))
                .andExpect(jsonPath("$[0].eventType").value("CONVERTED"))
                .andExpect(jsonPath("$[0].newValue", containsString("Linked to existing customer")));
    }

    @Test
    void oversizedFieldsReturnValidationErrorsInsteadOfDatabaseConflict() throws Exception {
        Lead proposal = lead(rep, LeadStatus.PROPOSAL_SENT, "long@client.test");

        mockMvc.perform(put("/api/v1/leads/" + proposal.getId() + "/status")
                        .header("Authorization", bearer(rep))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"LOST\",\"lossReason\":\"" + "x".repeat(501) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.lossReason").exists());

        mockMvc.perform(put("/api/v1/leads/" + proposal.getId() + "/status")
                        .header("Authorization", bearer(rep))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"WON\",\"dealValue\":123456789012.5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.dealValue").exists());
    }

    @Test
    void passwordResetInvalidatesExistingSessions() throws Exception {
        String oldToken = bearer(rep);

        mockMvc.perform(get("/api/v1/leads").header("Authorization", oldToken))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/users/reset-password/rep@test.local")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\":\"BrandNew123\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/leads").header("Authorization", oldToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"rep@test.local\",\"password\":\"BrandNew123\"}"))
                .andExpect(status().isOk());
    }
}
