<?php

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/Login.php";
if(!CheckSession()) {
    http_response_code(401);
    die("Je moet ingelogd zijn om dit deel van de API te gebruiken");
}

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/MySQL/ConnectionManager.php";
global $MySQLConnection;
$userInfo = $MySQLConnection->GetUser(GetSessionUsername());

header('Content-Type: application/json');
echo('{"modifyUsers":"' . $userInfo["modify_users"] . '","addFiles":"' . $userInfo["add_files"] . '","modifyInspiration":"' . $userInfo["modify_inspiration"] . '","modifyProjects":"' . $userInfo["modify_projects"] . '"}');