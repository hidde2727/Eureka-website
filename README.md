## The Eureka site 
#### Made by Hidde Meiburg 

To run this site you only need a server capabel of running php and a mysql database

To connect this database create a file called 'ConnectionData.php' in the Utils/MySQL folder with this content:

```PHP
<?php
$dbServername = "localhost";
$dbUsername = "username";
$dbPassword = "password";
$dbDatabase = "databaseName";
```

To setup the server visit www.domainName.xxx/Utils/Setup.php

This will setup the pepper and create an account with username='admin' and password='password'

PLEASE make sure that after setting things up you limit acces to the Utils folder by creating a .htaccess file with this content in it:

```
deny from all
```

To use 'Tom's Hoekje' and the inspiration tab you will also need to setup some API keys
First create a file in the Utils folder called APIKeys.php with this content:
'''PHP
<?php

$uploadThingKey="";

$youtubeAPI="";

$urlVerifier="";
'''
Then create a account at https://uploadthing.com and put your API key in the '''$uploadThingKey''' variable