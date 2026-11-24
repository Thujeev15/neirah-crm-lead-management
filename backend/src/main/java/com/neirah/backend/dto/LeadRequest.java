package com.neirah.backend.dto;

import com.neirah.backend.entity.Priority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class LeadRequest {

    @NotBlank(message = "Lead name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 150)
    private String company;

    @Email(message = "Enter a valid email")
    private String email;

    @Size(max = 30)
    private String phone;

    private String source;

    @NotNull(message = "Priority is required")
    private Priority priority;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
}
