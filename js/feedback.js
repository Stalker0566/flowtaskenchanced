/**
 * Feedback Form Handler
 * Handles form submission, validation, and AJAX communication
 */

class FeedbackForm {
    constructor() {
        this.form = document.getElementById('feedback-form');
        this.submitBtn = document.getElementById('submit-btn');
        this.messageContainer = document.getElementById('message-container');
        this.messageContent = document.getElementById('message-content');
        this.charCount = document.getElementById('char-count');
        this.messageTextarea = document.getElementById('message');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupCharacterCounter();
        this.setupRatingSystem();
    }
    
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
        
        // Category change handler
        const categorySelect = document.getElementById('category');
        categorySelect.addEventListener('change', (e) => this.handleCategoryChange(e));
    }
    
    setupCharacterCounter() {
        if (this.messageTextarea && this.charCount) {
            this.messageTextarea.addEventListener('input', () => {
                const length = this.messageTextarea.value.length;
                this.charCount.textContent = length;
                
                // Update counter styling based on length
                if (length > 1800) {
                    this.charCount.parentElement.className = 'char-counter error';
                } else if (length > 1500) {
                    this.charCount.parentElement.className = 'char-counter warning';
                } else {
                    this.charCount.parentElement.className = 'char-counter';
                }
            });
        }
    }
    
    setupRatingSystem() {
        const ratingInputs = document.querySelectorAll('.rating-input');
        ratingInputs.forEach(input => {
            input.addEventListener('change', () => this.updateRatingDisplay());
        });
    }
    
    handleCategoryChange(e) {
        const category = e.target.value;
        const subjectInput = document.getElementById('subject');
        const messageTextarea = document.getElementById('message');
        
        // Update placeholders based on category
        const placeholders = {
            'bug_report': {
                subject: 'Bug: Brief description of the issue',
                message: 'Please describe the bug in detail:\n\n1. What happened?\n2. What did you expect to happen?\n3. Steps to reproduce:\n4. Browser/Device information:'
            },
            'feature_request': {
                subject: 'Feature Request: Brief description',
                message: 'Please describe your feature request:\n\n1. What feature would you like to see?\n2. How would this feature help you?\n3. Any additional context or examples:'
            },
            'complaint': {
                subject: 'Complaint: Brief description',
                message: 'Please describe your concern:\n\n1. What went wrong?\n2. When did this happen?\n3. How has this affected you?\n4. What would you like us to do?'
            },
            'praise': {
                subject: 'Praise: What you liked',
                message: 'Please share what you liked about TaskFlow:\n\n1. What features do you enjoy most?\n2. How has TaskFlow helped you?\n3. Any specific highlights?'
            },
            'general_feedback': {
                subject: 'General Feedback: Brief description',
                message: 'Please share your thoughts, suggestions, or any other feedback about TaskFlow:'
            }
        };
        
        if (placeholders[category]) {
            subjectInput.placeholder = placeholders[category].subject;
            messageTextarea.placeholder = placeholders[category].message;
        }
    }
    
    updateRatingDisplay() {
        const checkedRating = document.querySelector('.rating-input:checked');
        const ratingStars = document.querySelectorAll('.rating-star');
        
        if (checkedRating) {
            const rating = parseInt(checkedRating.value);
            ratingStars.forEach((star, index) => {
                if (index < rating) {
                    star.style.filter = 'grayscale(0%)';
                    star.style.opacity = '1';
                } else {
                    star.style.filter = 'grayscale(100%)';
                    star.style.opacity = '0.5';
                }
            });
        }
    }
    
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';
        
        // Remove existing error styling
        this.clearFieldError(field);
        
        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(fieldName)} is required`;
        }
        
        // Email validation
        if (fieldName === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        // Message length validation
        if (fieldName === 'message' && value) {
            if (value.length < 10) {
                isValid = false;
                errorMessage = 'Message must be at least 10 characters long';
            } else if (value.length > 2000) {
                isValid = false;
                errorMessage = 'Message must be less than 2000 characters';
            }
        }
        
        // Subject length validation
        if (fieldName === 'subject' && value) {
            if (value.length < 5) {
                isValid = false;
                errorMessage = 'Subject must be at least 5 characters long';
            } else if (value.length > 500) {
                isValid = false;
                errorMessage = 'Subject must be less than 500 characters';
            }
        }
        
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.showFieldSuccess(field);
        }
        
        return isValid;
    }
    
    clearFieldError(field) {
        field.classList.remove('error');
        const errorMsg = field.parentElement.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = message;
        field.parentElement.appendChild(errorMsg);
    }
    
    showFieldSuccess(field) {
        field.classList.add('success');
        field.classList.remove('error');
    }
    
    getFieldLabel(fieldName) {
        const labels = {
            'name': 'Full Name',
            'email': 'Email Address',
            'subject': 'Subject',
            'message': 'Message',
            'category': 'Category'
        };
        return labels[fieldName] || fieldName;
    }
    
    validateForm() {
        const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!this.validateForm()) {
            this.showMessage('Please fix the errors above before submitting.', 'error');
            return;
        }
        
        // Show loading state
        this.setLoadingState(true);
        
        try {
            // Prepare form data
            const formData = new FormData(this.form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message'),
                category: formData.get('category'),
                rating: formData.get('rating') || null
            };
            
            // Send to API
            const response = await fetch('php/feedback-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage(result.message, 'success');
                this.form.reset();
                this.charCount.textContent = '0';
                this.charCount.parentElement.className = 'char-counter';
                this.updateRatingDisplay();
                
                // Track analytics
                this.trackFeedbackSubmission(data.category, data.rating);
            } else {
                throw new Error(result.message || 'Failed to submit feedback');
            }
            
        } catch (error) {
            console.error('Feedback submission error:', error);
            this.showMessage('Sorry, there was an error submitting your feedback. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    setLoadingState(loading) {
        if (loading) {
            this.submitBtn.disabled = true;
            this.submitBtn.classList.add('loading');
            this.submitBtn.querySelector('.btn-text').textContent = 'Sending...';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.classList.remove('loading');
            this.submitBtn.querySelector('.btn-text').textContent = 'Send Feedback';
        }
    }
    
    showMessage(message, type) {
        this.messageContent.textContent = message;
        this.messageContainer.className = `message-container ${type}`;
        this.messageContainer.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.messageContainer.style.display = 'none';
            }, 5000);
        }
        
        // Scroll to message
        this.messageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    trackFeedbackSubmission(category, rating) {
        // Track feedback submission for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'feedback_submitted', {
                'event_category': 'engagement',
                'event_label': category,
                'value': rating || 0
            });
        }
        
        // Log to console for debugging
        console.log('Feedback submitted:', { category, rating });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FeedbackForm();
});

// Export for potential use in other modules
window.FeedbackForm = FeedbackForm;
