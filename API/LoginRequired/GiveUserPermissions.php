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

if($sessionUsername == $username) ReturnFault("Can't modify self");

if(!isset($_POST['modifyUsers']))
    ReturnFault("Specificeer permissie voor veranderen gebruikers");
else if($_POST['modifyUsers'] != "1" && $_POST['modifyUsers'] != "0")
    ReturnFault("Permissie moet 1 of 0 zijn");
$modifyUsers = $_POST['modifyUsers'] == "1";

if(!isset($_POST['addFiles']))
    ReturnFault("Specificeer permissie voor toevoegen files");
else if($_POST['addFiles'] != "1" && $_POST['addFiles'] != "0")
    ReturnFault("Permissie moet 1 of 0 zijn");
$addFiles = $_POST['addFiles'] == "1";

if(!isset($_POST['modifyProjects']))
    ReturnFault("Specificeer permissie voor veranderen projecten");
else if($_POST['modifyProjects'] != "1" && $_POST['modifyProjects'] != "0")
    ReturnFault("Permissie moet 1 of 0 zijn");
$modifyProjects = $_POST['modifyProjects'] == "1";

if(!isset($_POST['modifyInspiration']))
    ReturnFault("Specificeer permissie voor veranderen inspiratie");
else if($_POST['modifyInspiration'] != "1" && $_POST['modifyInspiration'] != "0")
    ReturnFault("Permissie moet 1 of 0 zijn");
$modifyInspiration = $_POST['modifyInspiration'] == "1";

GiveUserPermissions($username, $modifyUsers, $addFiles, $modifyInspiration, $modifyProjects);
echo "Permissies aangepast";