<?php

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/MySQL/ConnectionManager.php";

function GenerateRandomBytes($size) {
    $bytes = array_fill(0, $size, 0);
    for($i = 0; $i < $size; $i++) {
        $bytes[$i] = random_int(0, 255);
    }
    return join(array_map("chr", $bytes));
}
function ValidatePassword($username, $password) {
    try {
        global $MySQLConnection;
        
        $hashedPassword = $MySQLConnection->GetUserPassword($username);

        $pepperFile = fopen($_SERVER['DOCUMENT_ROOT'] . "/Data/Private/Pepper.txt", "r") or die("Unable to open file! Please try again");
        $pepper = fread($pepperFile, filesize($_SERVER['DOCUMENT_ROOT'] . "/Data/Private/pepper.txt"));

        if($hashedPassword === null) { // The user was not found
            // Prevent timing attack so still hash and verify
            $pepperedPassword = hash_hmac("sha256", $password, $pepper, true);
            password_verify($pepperedPassword, "$2y$10$7EIWzQkiNmtX9ESy8W8XRu8RsKRY57q9ePYpqa.zYq5PAcAQ3vHnm");
        
            return false;
        }
        // Check the password
        $pepperedPassword = hash_hmac("sha256", $password, $pepper, true);
        fclose($pepperFile);
        if(!password_verify($pepperedPassword, $hashedPassword)) // Wrong password
            return false;
        return true;
    } catch(Exception $exc) {
        echo $exc->getMessage();
        return false;
    }
}

function GeneratePepper() {
    if (file_exists($_SERVER['DOCUMENT_ROOT'] . "/Data/Private/Pepper.txt"))
        unlink($_SERVER['DOCUMENT_ROOT'] . "/Data/Private/Pepper.txt");

    $pepper = GenerateRandomBytes(256);
    $pepperFile = fopen($_SERVER['DOCUMENT_ROOT'] . "/Data/Private/Pepper.txt", "w") or die("Unable to open file! Please try again");
    fwrite($pepperFile, $pepper);

    fclose($pepperFile);
}

function GenerateUser($username, $password) {
    global $MySQLConnection;

    $pepperFile = fopen($_SERVER['DOCUMENT_ROOT'] . "/Data/Private/Pepper.txt", "r") or die("Unable to open file! Please try again");
    $pepper = fread($pepperFile, filesize($_SERVER['DOCUMENT_ROOT'] . "/Data/Private/Pepper.txt"));

    $pepperedPassword = hash_hmac("sha256", $password, $pepper, true);
    $hashedPassword = password_hash($pepperedPassword, PASSWORD_DEFAULT);
    if(!password_verify($pepperedPassword, $hashedPassword))
        die("Help, the generated hash doesn't match the password");
    $MySQLConnection->CreateUser($username, $hashedPassword);

    fclose($pepperFile);
}
function DeleteUser($username) {
    global $MySQLConnection;
    $MySQLConnection->DeleteUser($username);
}

function CreateSession($username) {
    global $MySQLConnection;
    
    do { $sessionID = GenerateRandomBytes(32); }
    while($MySQLConnection->DoesSessionIDExist($sessionID));
    $sessionCredential = GenerateRandomBytes(32);

    $MySQLConnection->CreateSession($sessionID, $sessionCredential, $username);

    if(!setrawcookie("sessionID", rawurlencode($sessionID), 0, "/", "", true, false))
        die("Failed to set cookie");
    if(!setrawcookie("sessionCredential", rawurlencode($sessionCredential), 0, "/", "", true, false))
        die("Failed to set cookie");
    if(!setrawcookie("username", rawurlencode($username), 0, "/", "", true, false))
        die("Failed to set cookie");
}

function RemoveSessionCookies() {
    setcookie("sessionID", "", time() - 3600, "/");
    setcookie("sessionCredential", "", time() - 3600, "/");
    setcookie("sessionCredentialRepeat", "", time() - 3600, "/");
    setcookie("username", "", time() - 3600, "/");
    return false;
}
$sessionUsername = null;
$sessionUserID = null;
function CheckSession() {
    global $MySQLConnection;

    if(!isset($_COOKIE["sessionID"])) return RemoveSessionCookies();
    if(!isset($_COOKIE["sessionCredential"])) return RemoveSessionCookies();
    if(!isset($_SERVER["HTTP_SESSIONCREDENTIALREPEAT"])) return RemoveSessionCookies();
    if(!isset($_COOKIE["username"])) return RemoveSessionCookies();

    global $sessionUsername;
    global $sessionUserID;

    $sessionID = rawurldecode($_COOKIE["sessionID"]);
    $sessionCredential = rawurldecode($_COOKIE["sessionCredential"]);
    if($sessionCredential != rawurldecode($_SERVER["HTTP_SESSIONCREDENTIALREPEAT"]))
        return RemoveSessionCookies();
    $sessionUsername = rawurldecode($_COOKIE["username"]);

    $session = $MySQLConnection->GetSession($sessionID);
    if($session == null) return RemoveSessionCookies();
    if($session["id"] != $sessionID) return RemoveSessionCookies();
    if($session["credential"] != $sessionCredential) return RemoveSessionCookies();
    if($session["username"] != $sessionUsername) return RemoveSessionCookies();

    $sessionUserID = $session["user_ID"];

    return true;
}
function GetSessionUsername() {
    global $sessionUsername;
    if($sessionUsername == null) {
        if(!CheckSession())
            die("Can't retrieve username of user that is not logged in");
    }
    return $sessionUsername;
}
function GetSessionUserID() {
    global $sessionUserID;
    if($sessionUserID == null) {
        if(!CheckSession())
            die("Can't retrieve username of user that is not logged in");
    }
    return $sessionUserID;
}
function HasSessionUserPermission($permissionName) {
    try {
        global $MySQLConnection;
        global $sessionUserID;

        $userData = $MySQLConnection->GetUser($sessionUserID);

        return $userData[$permissionName];

    } catch(Exception $exc) {
        return false;
    }
}
function GiveUserPermissions($username, $modifyUsers, $addFiles, $modifyInspiration, $modifyProjects) {
    global $MySQLConnection;
    $MySQLConnection->SetUserPermissions($username, $modifyUsers, $addFiles, $modifyInspiration, $modifyProjects);
}

function RemoveSession() {
    global $MySQLConnection;
    $MySQLConnection->RemoveSession($_COOKIE["sessionID"]);
    RemoveSessionCookies();
}