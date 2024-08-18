<?php
require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/MySQL/ConnectionManager.php";

global $MySQLConnection;

// Project data
$MySQLConnection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS projects (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
name TINYTEXT NOT NULL,
description TEXT NOT NULL,
urls TEXT NOT NULL,
requester TINYTEXT NOT NULL,
executor TINYTEXT NOT NULL,
requester_email TINYTEXT NOT NULL,
last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
");

// Inspiration data
$MySQLConnection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS inspiration (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
type TINYTEXT NOT NULL,
name TINYTEXT NOT NULL,
description TEXT NOT NULL,
video_ID TINYTEXT NOT NULL,
url TEXT NOT NULL,
author TINYTEXT NOT NULL,
last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
");

// User data
$MySQLConnection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS users (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
username TINYTEXT NOT NULL,
password VARBINARY(255) NOT NULL,
modify_users BOOL DEFAULT FALSE,
add_files BOOL DEFAULT FALSE,
modify_inspiration BOOL DEFAULT FALSE,
modify_projects BOOL DEFAULT FALSE,
last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
");
if($MySQLConnection->IsTableEmpty("users")) {
    require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/Login.php";
    // Create a new pepper
    GeneratePepper();
    // Generate default user
    GenerateUser("admin", hash("sha256", "password", true));
    GiveUserPermissions("admin", true, true, true, true);
}
$MySQLConnection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS sessions (
id BINARY(32) NOT NULL PRIMARY KEY,
credential BINARY(32) NOT NULL,
username TINYTEXT NOT NULL,

user_ID INT UNSIGNED NOT NULL,

invalid_at TIMESTAMP DEFAULT DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR),

FOREIGN KEY(user_ID) REFERENCES users(id)
)
");

// Suggestions data
$MySQLConnection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS suggestions (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
type TINYTEXT NOT NULL,
json TEXT NOT NULL,
up_votes INT NOT NULL DEFAULT 0,
down_votes INT NOT NULL DEFAULT 0,
last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
");
$MySQLConnection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS suggestionVotes (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
up_or_down_vote BOOL NOT NULL,

user_ID INT UNSIGNED NOT NULL,
suggestion_ID INT UNSIGNED NOT NULL,

last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

FOREIGN KEY(user_ID) REFERENCES users(id),
FOREIGN KEY (suggestion_ID) REFERENCES suggestions(id)
)
");

echo "Setup complete";