<?php

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/Login.php";
if(!CheckSession()) {
    http_response_code(401);
    die("Je moet ingelogd zijn om dit deel van de API te gebruiken");
}
else if(!HasSessionUserPermission("modify_users")) {
    http_response_code(401);
    die("Geen permissie voor dit deel van de API");
}

function ReturnFault($message) {
    http_response_code(400);
    die($message);
}

if(!isset($_POST['username']) || empty($_POST['username']))
    ReturnFault("Specificeer een gebruikersnaam");
else if(strlen($_POST['username']) > 255)
    ReturnFault("Gebruikersnaam kan niet langer dan 255 karakters zijn");
else if(str_contains($_POST['username'], '"'))
    ReturnFault("Gebruikersnaam kan niet \" erin hebben");
$username = $_POST['username'];

if($sessionUsername == $username) ReturnFault("Can't delete self");

DeleteUser($username);
echo "Gebruiker verwijdert";