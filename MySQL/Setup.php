<?php
include "ConnectionManager.php";

$connection = new ConnectionManager();

// Project data
$connection->ExecuteStatement("
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
$connection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS inspiration (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
type TINYTEXT NOT NULL,
name TINYTEXT NOT NULL,
description TEXT NOT NULL,
videoID TINYTEXT NOT NULL,
url TEXT NOT NULL,
author TINYTEXT NOT NULL,
last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
");

// User data
$connection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS users (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
username TINYTEXT NOT NULL,
password TINYTEXT NOT NULL,
modify_users BOOL NOT NULL,
add_files BOOL NOT NULL,
modify_inspiration BOOL NOT NULL,
modify_projects BOOL NOT NULL,
last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
");

// Suggestions data
$connection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS suggestions (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
type TINYTEXT NOT NULL,
json TEXT NOT NULL,
up_votes INT NOT NULL DEFAULT 0,
down_votes INT NOT NULL DEFAULT 0,
last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
");
$connection->ExecuteStatement("
CREATE TABLE IF NOT EXISTS suggestionVotes (
id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
up_or_down_vote BOOL NOT NULL,

userID INT UNSIGNED NOT NULL,
suggestionID INT UNSIGNED NOT NULL,

last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

FOREIGN KEY(userID) REFERENCES users(id),
FOREIGN KEY (suggestionID) REFERENCES suggestions(id)
)
");

echo "Setup complete";