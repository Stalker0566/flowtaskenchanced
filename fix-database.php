<?php
/**
 * Fix Database Script - Create tasks table if it doesn't exist
 */

require_once 'php/config.php';

try {
    $pdo = get_db_connection();
    
    echo "<h2>Fixing TaskFlow Database</h2>\n";
    echo "<p>Creating tasks table...</p>\n";
    
    // Create tasks table with all required fields
    $sql = "CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        done BOOLEAN DEFAULT FALSE,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        category VARCHAR(100) DEFAULT 'general',
        tags JSON,
        due_date DATETIME NULL,
        completed_at TIMESTAMP NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_done (done),
        INDEX idx_priority (priority),
        INDEX idx_category (category),
        INDEX idx_due_date (due_date),
        INDEX idx_sort_order (sort_order),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    echo "<p style='color: green;'>✅ Tasks table created successfully!</p>\n";
    
    // Create composite indexes
    $indexes = [
        'idx_analytics_composite' => 'analytics(user_id, visit_timestamp)',
        'idx_tasks_composite' => 'user_tasks(user_id, is_completed, created_at)',
        'idx_sessions_composite' => 'user_sessions(user_id, is_active, expires_at)',
        'idx_react_tasks_composite' => 'tasks(user_id, done, created_at)',
        'idx_feedback_composite' => 'feedback(status, category, created_at)'
    ];
    
    foreach ($indexes as $index_name => $index_def) {
        try {
            $index_sql = "CREATE INDEX IF NOT EXISTS $index_name ON $index_def";
            $pdo->exec($index_sql);
            echo "<p style='color: green;'>✅ Index $index_name created</p>\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "<p style='color: blue;'>ℹ️ Index $index_name already exists</p>\n";
            } else {
                echo "<p style='color: orange;'>⚠️ Warning for $index_name: " . $e->getMessage() . "</p>\n";
            }
        }
    }
    
    // Test the table
    $test_sql = "SELECT COUNT(*) as count FROM tasks";
    $stmt = $pdo->query($test_sql);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<p style='color: blue;'>📊 Current tasks count: " . $result['count'] . "</p>\n";
    
    // Show table structure
    $structure_sql = "DESCRIBE tasks";
    $stmt = $pdo->query($structure_sql);
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Tasks Table Structure:</h3>\n";
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0; color: #333;'>\n";
    echo "<tr style='background: #f0f0f0;'><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>\n";
    
    foreach ($columns as $column) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($column['Field']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Key']) . "</td>";
        echo "<td>" . htmlspecialchars($column['Default'] ?? 'NULL') . "</td>";
        echo "</tr>\n";
    }
    echo "</table>\n";
    
    echo "<h3>Database Fix Complete!</h3>\n";
    echo "<p style='color: green; font-weight: bold;'>✅ All tables and indexes are ready!</p>\n";
    echo "<p>You can now use the enhanced tasks page at: <a href='index.html' style='color: #4f46e5;'>index.html</a></p>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>\n";
}
?>
