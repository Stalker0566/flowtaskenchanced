<?php
/**
 * Update Tasks Database Script
 * Adds new fields to the tasks table for enhanced functionality
 */

require_once 'php/config.php';

try {
    $pdo = get_db_connection();
    
    echo "<h2>Updating Tasks Database</h2>\n";
    echo "<p>Adding enhanced fields to tasks table...</p>\n";
    
    // Check if new columns exist and add them if they don't
    $columns_to_add = [
        'description' => 'TEXT',
        'priority' => "ENUM('low', 'medium', 'high') DEFAULT 'medium'",
        'category' => 'VARCHAR(100) DEFAULT "general"',
        'tags' => 'JSON',
        'due_date' => 'DATETIME NULL',
        'completed_at' => 'TIMESTAMP NULL',
        'sort_order' => 'INT DEFAULT 0'
    ];
    
    foreach ($columns_to_add as $column => $definition) {
        try {
            $sql = "ALTER TABLE tasks ADD COLUMN $column $definition";
            $pdo->exec($sql);
            echo "<p style='color: green;'>✅ Added column: $column</p>\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "<p style='color: blue;'>ℹ️ Column $column already exists</p>\n";
            } else {
                echo "<p style='color: orange;'>⚠️ Warning for $column: " . $e->getMessage() . "</p>\n";
            }
        }
    }
    
    // Add new indexes
    $indexes_to_add = [
        'idx_priority' => 'priority',
        'idx_category' => 'category',
        'idx_due_date' => 'due_date',
        'idx_sort_order' => 'sort_order'
    ];
    
    foreach ($indexes_to_add as $index_name => $column) {
        try {
            $sql = "CREATE INDEX $index_name ON tasks($column)";
            $pdo->exec($sql);
            echo "<p style='color: green;'>✅ Added index: $index_name</p>\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
                echo "<p style='color: blue;'>ℹ️ Index $index_name already exists</p>\n";
            } else {
                echo "<p style='color: orange;'>⚠️ Warning for $index_name: " . $e->getMessage() . "</p>\n";
            }
        }
    }
    
    // Update existing tasks to have default values
    $update_sql = "UPDATE tasks SET 
        priority = 'medium' WHERE priority IS NULL,
        category = 'general' WHERE category IS NULL OR category = '',
        sort_order = id WHERE sort_order = 0 OR sort_order IS NULL";
    
    try {
        $pdo->exec($update_sql);
        echo "<p style='color: green;'>✅ Updated existing tasks with default values</p>\n";
    } catch (PDOException $e) {
        echo "<p style='color: orange;'>⚠️ Warning updating tasks: " . $e->getMessage() . "</p>\n";
    }
    
    // Test the enhanced table
    $test_sql = "SELECT COUNT(*) as count FROM tasks";
    $stmt = $pdo->query($test_sql);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<p style='color: blue;'>📊 Current tasks count: " . $result['count'] . "</p>\n";
    
    // Show table structure
    $structure_sql = "DESCRIBE tasks";
    $stmt = $pdo->query($structure_sql);
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Updated Table Structure:</h3>\n";
    echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>\n";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>\n";
    
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
    
    echo "<h3>Database Update Complete!</h3>\n";
    echo "<p>You can now use the enhanced tasks page at: <a href='enhanced-tasks.html'>enhanced-tasks.html</a></p>\n";
    echo "<p><strong>New Features Available:</strong></p>\n";
    echo "<ul>\n";
    echo "<li>✅ Progress bar with completion percentage</li>\n";
    echo "<li>✅ Drag & drop task reordering</li>\n";
    echo "<li>✅ Task animations (add/remove)</li>\n";
    echo "<li>✅ Task counter and statistics</li>\n";
    echo "<li>✅ Enhanced task cards with better styling</li>\n";
    echo "<li>✅ Font Awesome icons</li>\n";
    echo "<li>✅ Inline task editing</li>\n";
    echo "<li>✅ Deadline support with date picker</li>\n";
    echo "<li>✅ Priority system (low, medium, high)</li>\n";
    echo "<li>✅ Categories and tags</li>\n";
    echo "</ul>\n";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>\n";
}
?>
