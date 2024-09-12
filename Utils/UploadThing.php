<?php

require_once $_SERVER['DOCUMENT_ROOT'] . "/Utils/ApiKeys.php";
set_include_path($_SERVER['DOCUMENT_ROOT'] . "/Libraries/uploadthing/src");
require_once "/UploadThing.php";

$uploadThing = new UploadThing('your-api-key');

// Upload a file
$file = $request->file('file');
$uploadThing->upload($file);

// Get file list
$uploadThing->listFiles();

// Rename files
$uploadThing->renameFiles([
  ["fileKey" => "fileKey1", "newName" => "newName2"],
  ["fileKey" => "fileKey2", "newName" => "newName2"]
]);
// or
$uploadThing->renameFile(["fileKey" => "fileKey1", "newName" => "newName2"]);

// Delete files
$uploadThing->deleteFiles(["fileKey1", "fileKey2"]);

// Get file urls
$uploadThing->getFileUrls(["fileKey1", "fileKey2"]);

// Get usage stats
$uploadThing->getUsageInfo();