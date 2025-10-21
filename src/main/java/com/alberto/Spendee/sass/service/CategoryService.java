package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.transaction.Category;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.repository.CategoryRepository;
import com.alberto.Spendee.sass.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;


    /**
     * Get all categories for a user
     */
    public List<Category> getCategoriesByUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get user-specific categories plus default system categories
        return categoryRepository.findByUserOrIsDefaultTrue(user);
    }

    /**
     * Get a category by ID, ensuring it belongs to the user or is a default category
     */
    public Category getCategoryById(Long categoryId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return categoryRepository.findByIdAndUserOrIsDefaultTrue(categoryId, user)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    /**
     * Create a new category for a user
     */
    @Transactional
    public Category createCategory(Category category, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        category.setUser(user);
        return categoryRepository.save(category);
    }

    /**
     * Update an existing category
     */
    @Transactional
    public Category updateCategory(Long categoryId, Category updatedCategory, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category existingCategory = categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new RuntimeException("Category not found or not owned by user"));

        // Cannot update default categories
        if (existingCategory.isDefault()) {
            throw new RuntimeException("Default categories cannot be modified");
        }

        existingCategory.setName(updatedCategory.getName());
        existingCategory.setDescription(updatedCategory.getDescription());
        existingCategory.setColor(updatedCategory.getColor());
        existingCategory.setIcon(updatedCategory.getIcon());

        return categoryRepository.save(existingCategory);
    }

    /**
     * Delete a category
     */
    @Transactional
    public void deleteCategory(Long categoryId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new RuntimeException("Category not found or not owned by user"));

        // Cannot delete default categories
        if (category.isDefault()) {
            throw new RuntimeException("Default categories cannot be deleted");
        }

        // Move transactions in this category to the default General category
        Category generalCategory = findOrCreateGeneralCategory(userEmail);
        category.getTransactions().forEach(transaction -> transaction.setCategory(generalCategory));

        categoryRepository.delete(category);
    }

    /**
     * Delete multiple categories at once
     */
    @Transactional
    public void deleteCategories(List<Long> categoryIds, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get the General category to move transactions to
        Category generalCategory = findOrCreateGeneralCategory(userEmail);

        for (Long categoryId : categoryIds) {
            try {
                Category category = categoryRepository.findByIdAndUser(categoryId, user)
                    .orElseThrow(() -> new RuntimeException("Category not found or not owned by user"));

                // Skip default categories
                if (category.isDefault()) {
                    continue;
                }

                // Move transactions to the General category
                category.getTransactions().forEach(transaction -> transaction.setCategory(generalCategory));

                // Delete the category
                categoryRepository.delete(category);
            } catch (Exception e) {
                // Log error but continue with other categories
                System.err.println("Error deleting category ID " + categoryId + ": " + e.getMessage());
            }
        }
    }

    /**
     * Find or create the General category for a user
     * First tries to find an existing General category for the user,
     * then looks for a system-wide General category,
     * and finally creates a new one if neither exists.
     */
    @Transactional
    public Category findOrCreateGeneralCategory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // First check if user has their own General category
        Optional<Category> userGeneralCategory = categoryRepository.findByNameAndUser("General", user);
        if (userGeneralCategory.isPresent()) {
            return userGeneralCategory.get();
        }

        // Then try to find a system-wide General category
        Optional<Category> defaultCategory = categoryRepository.findByNameAndIsDefaultTrue("General");
        if (defaultCategory.isPresent()) {
            return defaultCategory.get();
        }

        // If no General category exists, create a default one for this user
        Category generalCategory = new Category();
        generalCategory.setName("General");
        generalCategory.setDescription("Default category for uncategorized transactions");
        generalCategory.setColor("#808080");
        generalCategory.setIcon("fa-folder");
        generalCategory.setUser(user);
        generalCategory.setDefault(true);

        return categoryRepository.save(generalCategory);
    }
}
