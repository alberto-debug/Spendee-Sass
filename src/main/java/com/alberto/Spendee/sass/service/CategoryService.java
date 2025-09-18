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
        
        // TODO: Move transactions in this category to the default General category
        Category generalCategory = getOrCreateGeneralCategory(userEmail);
        category.getTransactions().forEach(transaction -> transaction.setCategory(generalCategory));
        
        categoryRepository.delete(category);
    }
    
    /**
     * Get or create the General category
     */
    @Transactional
    public Category getOrCreateGeneralCategory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // First try to find a system-wide General category
        Optional<Category> defaultCategory = categoryRepository.findByNameAndIsDefaultTrue("General");
        
        if (defaultCategory.isPresent()) {
            return defaultCategory.get();
        }
        
        // If not found, check if user has their own General category
        Optional<Category> userGeneralCategory = categoryRepository.findByNameAndUser("General", user);
        
        if (userGeneralCategory.isPresent()) {
            return userGeneralCategory.get();
        }
        
        // If no General category exists, create a default one
        Category generalCategory = new Category();
        generalCategory.setName("General");
        generalCategory.setDescription("Default general category");
        generalCategory.setColor("#6c63ff");
        generalCategory.setIcon("fa-folder");
        generalCategory.setDefault(true);
        generalCategory.setUser(null); // System-wide default category
        
        return categoryRepository.save(generalCategory);
    }
}
