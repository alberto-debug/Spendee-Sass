package com.alberto.Spendee.sass.domain.transaction;

import jakarta.persistence.*;
import com.alberto.Spendee.sass.domain.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column
    private String color;

    @Column
    private String icon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore // Prevent serializing the user object
    private User user;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @JsonIgnore // Prevent serializing the transactions
    private Set<Transaction> transactions = new HashSet<>();

    // Indicates if this is a system default category
    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    public Category() {
    }

    public Category(String name, String description, String color, String icon, User user, boolean isDefault) {
        this.name = name;
        this.description = description;
        this.color = color;
        this.icon = icon;
        this.user = user;
        this.isDefault = isDefault;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Set<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(Set<Transaction> transactions) {
        this.transactions = transactions;
    }

    public boolean isDefault() {
        return isDefault;
    }

    public void setDefault(boolean isDefault) {
        this.isDefault = isDefault;
    }
}
