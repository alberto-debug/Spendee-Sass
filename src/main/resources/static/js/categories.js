/**
 * Categories management JavaScript for Spendee application
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const categoriesContainer = document.getElementById('categoriesContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noCategoriesMessage = document.getElementById('noCategoriesMessage');
    const colorPreview = document.getElementById('colorPreview');
    const editColorPreview = document.getElementById('editColorPreview');
    const categoryColor = document.getElementById('categoryColor');
    const editCategoryColor = document.getElementById('editCategoryColor');

    // Modal elements
    const addCategoryForm = document.getElementById('addCategoryForm');
    const editCategoryForm = document.getElementById('editCategoryForm');
    const addCategoryModal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
    const editCategoryModal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));

    // API endpoints
    const API_URL = '/api';
    const CATEGORIES_ENDPOINT = `${API_URL}/categories`;

    // Current category being edited (for delete operation)
    let currentCategoryId = null;

    // Initialize page
    init();

    // Update color preview when color input changes
    categoryColor.addEventListener('input', () => {
        colorPreview.style.backgroundColor = categoryColor.value;
    });

    editCategoryColor.addEventListener('input', () => {
        editColorPreview.style.backgroundColor = editCategoryColor.value;
    });

    // Initialize color preview on page load
    colorPreview.style.backgroundColor = categoryColor.value;

    // Add event listeners
    document.getElementById('saveCategory').addEventListener('click', saveCategory);
    document.getElementById('updateCategory').addEventListener('click', updateCategory);
    document.getElementById('deleteCategory').addEventListener('click', confirmDeleteCategory);
    document.getElementById('confirmDelete').addEventListener('click', deleteCategory);

    /**
     * Initialize the page
     */
    function init() {
        // Load categories
        fetchCategories();

        // Reset forms when modals are closed
        document.getElementById('addCategoryModal').addEventListener('hidden.bs.modal', () => {
            addCategoryForm.reset();
            colorPreview.style.backgroundColor = categoryColor.value;
        });

        document.getElementById('editCategoryModal').addEventListener('hidden.bs.modal', () => {
            editCategoryForm.reset();
        });
    }

    /**
     * Fetch all categories from the API
     */
    function fetchCategories() {
        loadingIndicator.classList.remove('d-none');
        noCategoriesMessage.classList.add('d-none');

        fetch(CATEGORIES_ENDPOINT)
            .then(handleResponse)
            .then(categories => {
                loadingIndicator.classList.add('d-none');

                if (categories.length === 0) {
                    noCategoriesMessage.classList.remove('d-none');
                } else {
                    renderCategories(categories);
                }
            })
            .catch(error => {
                loadingIndicator.classList.add('d-none');
                noCategoriesMessage.classList.remove('d-none');
                toast.error('Error loading categories: ' + error.message);
                console.error('Error fetching categories:', error);
            });
    }

    /**
     * Render the categories in the UI
     */
    function renderCategories(categories) {
        // Clear existing content except loading indicator and no categories message
        const elementsToKeep = [loadingIndicator, noCategoriesMessage];
        Array.from(categoriesContainer.children)
            .filter(child => !elementsToKeep.includes(child))
            .forEach(child => child.remove());

        // Add each category as a card
        categories.forEach(category => {
            const isDefault = category.default === true;
            const categoryCard = document.createElement('div');
            categoryCard.className = 'col-md-4 col-lg-3 mb-4';
            categoryCard.innerHTML = `
                <div class="card h-100">
                    <div class="card-header d-flex align-items-center" style="background-color: ${category.color};">
                        <i class="fas ${category.icon} me-2"></i>
                        <h5 class="card-title mb-0">${category.name}</h5>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${category.description || 'No description'}</p>
                        ${isDefault ? '<div class="badge bg-info mb-2">Default</div>' : ''}
                    </div>
                    <div class="card-footer d-flex justify-content-end">
                        <button class="btn btn-sm ${isDefault ? 'btn-secondary' : 'btn-primary'}" 
        // Reset selection if we're re-rendering
        selectedCategories.clear();
        updateSelectedCount();
        
        // Show selection controls if there are categories
        if (categories.length > 0) {
            selectionControls.classList.remove('d-none');
        } else {
            selectionControls.classList.add('d-none');
        }

                                onclick="editCategory(${category.id})"
                                ${isDefault ? 'disabled' : ''}>
                            <i class="fas fa-edit"></i> ${isDefault ? 'Default' : 'Edit'}
                        </button>
                    </div>
            
            // Create the card content with checkbox for selection
                </div>
                <div class="card h-100 position-relative">
                    <div class="form-check position-absolute top-0 start-0 m-2 z-index-1">
                        <input class="form-check-input categoryCheckbox" type="checkbox" value="${category.id}" 
                               id="category-${category.id}" ${isDefault ? 'disabled' : ''}>
                    </div>

            categoriesContainer.appendChild(categoryCard);
        });
    }

    /**
     * Edit a category
     */
    function editCategory(categoryId) {
        currentCategoryId = categoryId;

        fetch(`${CATEGORIES_ENDPOINT}/${categoryId}`)
            .then(handleResponse)
            .then(category => {
                document.getElementById('editCategoryId').value = category.id;
                document.getElementById('editCategoryName').value = category.name;
                document.getElementById('editCategoryDescription').value = category.description || '';
                document.getElementById('editCategoryColor').value = category.color;
                document.getElementById('editCategoryIcon').value = category.icon;

            // Add event listener to the checkbox after it's added to the DOM
            const checkbox = categoryCard.querySelector('.categoryCheckbox');
            if (checkbox && !isDefault) {
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        selectedCategories.add(this.value);
                    } else {
                        selectedCategories.delete(this.value);
                    }
                    updateSelectedCount();
                    toggleDeleteSelectedButton();
                });
            }

    }

    /**
     * Toggle the Delete Selected button visibility based on selection
     */
    function toggleDeleteSelectedButton() {
        if (selectedCategories.size > 0) {
            deleteSelectedBtn.classList.remove('d-none');
        } else {
            deleteSelectedBtn.classList.add('d-none');
        }
                editColorPreview.style.backgroundColor = category.color;

                // Show the edit modal
                editCategoryModal.show();
            })
            .catch(error => {
                toast.error('Error loading category: ' + error.message);
                console.error('Error fetching category:', error);
            });
    }

    /**
     * Save a new category
     */
    function saveCategory() {
        const name = document.getElementById('categoryName').value.trim();
        const description = document.getElementById('categoryDescription').value.trim();
        const color = document.getElementById('categoryColor').value;
        const icon = document.getElementById('categoryIcon').value;

        if (!name) {
            toast.warning('Please enter a category name');
            return;
        }

        const category = {
            name,
            description,
            color,
            icon
        };

        fetch(CATEGORIES_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(category)
        })
        .then(handleResponse)
        .then(newCategory => {
            toast.success('Category created successfully');
            fetchCategories(); // Refresh the list
            addCategoryModal.hide();
        })
        .catch(error => {
            toast.error('Error creating category: ' + error.message);
            console.error('Error creating category:', error);
        });
    }

    /**
     * Update an existing category
     */
    function updateCategory() {
        const id = document.getElementById('editCategoryId').value;
        const name = document.getElementById('editCategoryName').value.trim();
        const description = document.getElementById('editCategoryDescription').value.trim();
        const color = document.getElementById('editCategoryColor').value;
        const icon = document.getElementById('editCategoryIcon').value;

        if (!name) {
            toast.warning('Please enter a category name');
            return;
        }

        const category = {
            name,
            description,
            color,
            icon
        };

        fetch(`${CATEGORIES_ENDPOINT}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(category)
        })
        .then(handleResponse)
        .then(updatedCategory => {
            toast.success('Category updated successfully');
            fetchCategories(); // Refresh the list
            editCategoryModal.hide();
        })
        .catch(error => {
            toast.error('Error updating category: ' + error.message);
            console.error('Error updating category:', error);
        });
    }

    /**
     * Show confirmation modal for category deletion
     */
    function confirmDeleteCategory() {
        editCategoryModal.hide();
        confirmationModal.show();
    }

    /**
     * Delete a category
     */
    function deleteCategory() {
        if (!currentCategoryId) {
            toast.error('No category selected for deletion');
            confirmationModal.hide();
            return;
        }

        fetch(`${CATEGORIES_ENDPOINT}/${currentCategoryId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Error deleting category');
                });
            }
            return null;
        })
        .then(() => {
            toast.success('Category deleted successfully');
            fetchCategories(); // Refresh the list
            confirmationModal.hide();
            currentCategoryId = null;
        })
        .catch(error => {
            toast.error('Error deleting category: ' + error.message);
            console.error('Error deleting category:', error);
            confirmationModal.hide();
        });
    }

    /**
     * Handle API response
     */
    function handleResponse(response) {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'An error occurred');
            });
        }
        return response.json();
    }

    // Make editCategory function globally accessible
    window.editCategory = editCategory;
});
