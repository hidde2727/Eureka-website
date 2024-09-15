## The Eureka site 
#### Made by Hidde Meiburg 

To run this site you only need a server capabel of running nodejs and a mysql database

To connect this database create a file called 'Config.js' in the Utils folder with this content:

```js
var config = {
    db: {
        host:       '127.0.0.1',
        user:       'test',
        password:   'password',
        database:   'test'
    }
};
module.exports = config;
```

To setup the server visit www.domainName.xxx/setup

This will setup the pepper and create an account with username='admin' and password='password'

PLEASE make sure that after setting things up you limit acces to the Utils folder by creating a .htaccess file with this content in it:

```
deny from all
```

Just to be on the safe side, if you are not debugging the application delete the Setup.js file and delete the part of server.js that is marked to be deleted


To use this project in a local enviroment first install nodejs: https://nodejs.org/en/download/prebuilt-installer/current

Next up run, from the main directory with the package.json file, '''npm install'''

Then start the server with the '''node server.js''' command