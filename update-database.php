<?php
/**
 * Database Update Script - Add Feedback Table
 * Run this script to add the feedback table to your existing database
 */

require_once 'php/config.php';

try {
    $pdo = get_db_connection();
    
    echo "<h2>Updating TaskFlow Database</h2>\n";
    echo "<p>Adding feedback table...</p>\n";
    
    // Create feedback table
    $sql = "CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        rating INT DEFAULT NULL,
        category ENUM('bug_report', 'feature_request', 'general_feedback', 'complaint', 'praise') DEFAULT 'general_feedback',
        status ENUM('new', 'in_progress', 'resolved', 'closed') DEFAULT 'new',
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        admin_response TEXT NULL,
        admin_response_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_category (category),
        INDEX idx_rating (rating),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    echo "<p style='color: green;'>✅ Feedback table created successfully!</p>\n";
    
    // Create composite index
    $index_sql = "CREATE INDEX IF NOT EXISTS idx_feedback_composite ON feedback(status, category, created_at)";
    $pdo->exec($index_sql);
    echo "<p style='color: green;'>✅ Feedback indexes created successfully!</p>\n";
    
    // Test the table
    $test_sql = "SELECT COUNT(*) as count FROM feedback";
    $stmt = $pdo->query($test_sql);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<p style='color: blue;'>📊 Current feedback count: " . $result['count'] . "</p>\n";
    
    echo "<h3>Database Update Complete!</h3>\n";
    echo "<p>You can now use the feedback form at: <a href='feedback.html'>feedback.html</a></p>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>\n";
}
?>
