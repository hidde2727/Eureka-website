<?php

function ReturnFault($message) {
    http_response_code(400);
    die($message);
}
function IsBase64($string) {
    return preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $string);
}

if(!isset($_POST['username']) || empty($_POST['username']))
    ReturnFault("Specificeer een gebruikersnaam");
else if(strlen($_POST['username']) > 255)
    ReturnFault("Gebruikersnaam kan niet langer dan 255 karakters zijn");
else if(str_contains($_POST['username'], '"'))
    ReturnFault("Gebruikersnaam kan niet \" erin hebben");
$username = $_POST['username'];

if(!isset($_POST['password']) || empty($_POST['password']))
    ReturnFault("Specificeer een wachtwoord");
else if(strlen($_POST['password']) != 44)
    ReturnFault("Wachtwoord moet 44 karakters zijn");
else if(!IsBase64($_POST['password']))
    ReturnFault("Wachtwoord moet base64 encoded zijn");
$password = $_POST['password'];

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/Login.php";
if(!ValidatePassword($username, base64_decode($password))) {
    http_response_code(401);
    die("Verkeerde credentials");
}
// Correct password - give user the correct cookies
if(CheckSession())
    exit("Already logged in");

CreateSession($username);
echo "Correct!!!";