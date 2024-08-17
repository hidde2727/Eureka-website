<?php

function ReturnFault($message) {
    http_response_code(400);
    die($message);
}
try {

if(!isset($_POST['projectName']) || empty($_POST['projectName']))
    ReturnFault("Specificeer een project naam");
else if(strlen($_POST['projectName']) > 255)
    ReturnFault("Project naam kan niet langer dan 255 karakters zijn");
else if(str_contains($_POST['projectName'], '"'))
    ReturnFault("Project naam kan niet \" erin hebben");
$projectName = $_POST['projectName'];

if(!isset($_POST['projectDescription']) || empty($_POST['projectDescription']))
    ReturnFault("Specificeer een project omschrijving");
else if(strlen($_POST['projectDescription']) > 65535)
    ReturnFault("Project omschrijving kan niet langer dan 65535 karakters zijn");
else if(str_contains($_POST['projectDescription'], '"'))
    ReturnFault("Project omschrijving kan niet \" erin hebben");
$projectDescription = $_POST['projectDescription'];

if(!isset($_POST['amountLinks']) || empty($_POST['amountLinks']))
    ReturnFault("Specificeer de hoeveelheid linkjes");
else if(!ctype_digit($_POST['amountLinks']))
    ReturnFault("Hoeveelheid linkjes moet een nummer zijn");
$amountLinks = intval($_POST['amountLinks'], 10);

$links = array_fill(0, $amountLinks, "");
for($i = 1; $i <= $amountLinks; $i++) {
    if(!isset($_POST['link' . $i]) || empty($_POST['link' . $i]))
        ReturnFault("Specificeer link " . $i);
    else if(strlen($_POST['link' . $i]) > 255)
        ReturnFault("Link mag niet langer zijn dan 255 karakters");
    else if(!filter_var($_POST['link' . $i], FILTER_VALIDATE_URL))
        ReturnFault("Link moet valide zijn");
    else if(str_contains($_POST['link' . $i], '"'))
        ReturnFault("Link kan niet \" erin hebben");
    $links[$i - 1] = $_POST['link' . $i];
}

if(!isset($_POST['projectSuggestor']) || empty($_POST['projectSuggestor']))
    ReturnFault("Specificeer het persoon die dit voorsteld");
else if(is_numeric($_POST['projectSuggestor']))
    ReturnFault("Persoon die het voorsteld kan niet langer dan 255 karakters zijn");
else if(str_contains($_POST['projectSuggestor'], '"'))
    ReturnFault("Persoon die het voorsteld kan niet \" erin hebben");

$projectSuggestor = $_POST['projectSuggestor'];

if(!isset($_POST['projectSuggestorEmail']) || empty($_POST['projectSuggestorEmail']))
    ReturnFault("Specificeer de email van het persoon die dit voorsteld");
else if(is_numeric($_POST['projectSuggestorEmail']))
    ReturnFault("Email van het persoon die het voorsteld kan niet langer dan 255 karakters zijn");
else if(!filter_var($_POST['projectSuggestorEmail'], FILTER_VALIDATE_EMAIL))
    ReturnFault("Specificeer een valide email");
else if(str_contains($_POST['projectSuggestorEmail'], '"'))
    ReturnFault("Email van het persoon die het voorsteld kan niet \" erin hebben");
$projectSuggestorEmail = $_POST['projectSuggestorEmail'];

$json = '{';
$json .= '"projectName":"' . $projectName . '",';
$json .= '"projectDescription":"' . $projectDescription . '",';
$json .= '"links":[';
for($i = 0; $i < $amountLinks; $i++) {
    if($i != 0)
        $json .= ',';
    $json .= '"' . $links[$i] . '"';
}
$json .= '],';
$json .= '"projectSuggestor":"' . $projectSuggestor . '",';
$json .= '"projectSuggestorEmail":"' . $projectSuggestorEmail . '"';
$json .= '}';

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/MySQL/ConnectionManager.php";
$MySQLConnection->AddProjectSuggestion($json);

echo 'Project is aangevraagd!';

} catch(Exception $e) {
    ReturnFault("Er is iets fout gegaan");
}