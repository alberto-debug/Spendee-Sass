package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.domain.transaction.Category;
import com.alberto.Spendee.sass.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * Get all categories for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories(Authentication authentication) {
        String userEmail = authentication.getName();
        List<Category> categories = categoryService.getCategoriesByUser(userEmail);
        return ResponseEntity.ok(categories);
    }

    /**
     * Get a specific category by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Category category = categoryService.getCategoryById(id, userEmail);
            return ResponseEntity.ok(category);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a new category
     */
    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody Category category, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Category createdCategory = categoryService.createCategory(category, userEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdCategory);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }

    /**
     * Update an existing category
     */
    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable Long id,
            @RequestBody Category category,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Category updatedCategory = categoryService.updateCategory(id, category, userEmail);
            return ResponseEntity.ok(updatedCategory);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Delete a category
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            categoryService.deleteCategory(id, userEmail);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete multiple categories at once
     */
    @DeleteMapping
    public ResponseEntity<?> bulkDeleteCategories(@RequestBody Map<String, List<Long>> requestBody, Authentication authentication) {
        try {
            List<Long> categoryIds = requestBody.get("ids");
            if (categoryIds == null || categoryIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(java.util.Collections.singletonMap("error", "No category IDs provided"));
            }

            String userEmail = authentication.getName();
            categoryService.deleteCategories(categoryIds, userEmail);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }
}
