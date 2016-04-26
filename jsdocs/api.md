
## Members
Global | Description
------ | -----------
mongoose | Module dependencies.
mongoose | Module dependencies.
mongoose | Module dependencies.

## Functions
Global | Description
------ | -----------
rename(file, dest, user, callback) | Changes the name of an existing file
mkdir_p(path-, position, callback) | Make a new directory
publishEvent(MeanUpload, user, data) | Publish a new file event to the project's display
create(req, res, next) | Create user
user(req, res, next, id) | Find user by id
update(req, res) | Update a user
destroy(req, res) | Delete an user
all(req, res) | List of Users
article(req, res, next, id) | Find article by id
create(req, res) | Create an article
update(req, res) | Update an article
destroy(req, res) | Delete an article
show(req, res) | Show an article
all(req, res) | List of Articles
sendMail(mailOptions) | Send reset password email
authCallback(req, res) | Auth callback
signin(req, res) | Show login form
signout(req, res) | Logout
session(req, res) | A user's log in session
create(req, res, next) | Create a new admin by means of another admin
me(req, res) | Send User
user(req, res, next, id) | Find user by id
resetpassword(res, res, next) | Resets the password
forgotpassword(req, res, next) | Callback for forgot password link
ExpertiseGraph(initConfig) | Class that handles drawing of the expertise graph

## mongoose
Module dependencies.

**Kind**: global variable  
## mongoose
Module dependencies.

**Kind**: global variable  
## mongoose
Module dependencies.

**Kind**: global variable  
## rename(file, dest, user, callback)
Changes the name of an existing file

**Kind**: global function  

| Param | Description |
| --- | --- |
| file | the file to be renamed |
| dest | where the file is located |
| user | the admin who created the file |
| callback | the path to callback the file |

## mkdir_p(path-, position, callback)
Make a new directory

**Kind**: global function  

| Param | Description |
| --- | --- |
| path- | the path where the folder will be created |
| position | the location of folder |
| callback | the path to callback |

## publishEvent(MeanUpload, user, data)
Publish a new file event to the project's display

**Kind**: global function  

| Param | Description |
| --- | --- |
| MeanUpload | the service used to publish a file through mean |
| user | the admin who created the file |
| data | the actual dataz of the file |

## create(req, res, next)
Create user

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to make a user |
| res | the result of adding a new user |
| next |  |

## user(req, res, next, id)
Find user by id

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to find a user |
| res | the result of finding a new user |
| next |  |
| id | the id of user |

## update(req, res)
Update a user

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to update a user |
| res | the result of updating a new user |

## destroy(req, res)
Delete an user

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to delete a user |
| res | the result of deleting a new user |

## all(req, res)
List of Users

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to find users |
| res | the result of list of ussers |

## article(req, res, next, id)
Find article by id

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials |
| res | the result |
| next |  |
| id | the id of an article |

## create(req, res)
Create an article

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to create an article |
| res | the result |

## update(req, res)
Update an article

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to create an article |
| res | the result |

## destroy(req, res)
Delete an article

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to delete an article |
| res | the result |

## show(req, res)
Show an article

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to show an article |
| res | the result |

## all(req, res)
List of Articles

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the required credentials to show an article |
| res | the result |

## sendMail(mailOptions)
Send reset password email

**Kind**: global function  

| Param | Description |
| --- | --- |
| mailOptions | the email service |

## authCallback(req, res)
Auth callback

**Kind**: global function  

| Param |
| --- |
| req | 
| res | 

## signin(req, res)
Show login form

**Kind**: global function  

| Param | Description |
| --- | --- |
| req |  |
| res | where to redirect |

## signout(req, res)
Logout

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | credentials of the users |
| res | the output of the result |

## session(req, res)
A user's log in session

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | credentials of the users |
| res | the output of the result |

## create(req, res, next)
Create a new admin by means of another admin

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the credentails required to create a user |
| res | the result |
| next |  |

## me(req, res)
Send User

**Kind**: global function  

| Param |
| --- |
| req | 
| res | 

## user(req, res, next, id)
Find user by id

**Kind**: global function  

| Param | Description |
| --- | --- |
| req | the credentails required to create a user |
| res | the result |
| next |  |
| id | the id of th user |

## resetpassword(res, res, next)
Resets the password

**Kind**: global function  

| Param |
| --- |
| res | 
| res | 
| next | 

## forgotpassword(req, res, next)
Callback for forgot password link

**Kind**: global function  

| Param |
| --- |
| req | 
| res | 
| next | 

## ExpertiseGraph(initConfig)
Class that handles drawing of the expertise graph

**Kind**: global function  

| Param | Description |
| --- | --- |
| initConfig | initial graph options |


* [ExpertiseGraph(initConfig)](#markdown-header-expertisegraphinitconfig)
    * [~showLoadingScreen()](#markdown-header-expertisegraphshowloadingscreen)
    * [~formatSOData(issueTagData,)](#markdown-header-expertisegraphformatsodataissuetagdata)
        * [~countValues(ary,)](#markdown-header-formatsodatacountvaluesary)
    * [~isConnected(a,)](#markdown-header-expertisegraphisconnecteda)
    * [~hasConnections(a)](#markdown-header-expertisegraphhasconnectionsa)
    * [~tick()](#markdown-header-expertisegraphtick)
    * [~set_highlight(d,)](#markdown-header-expertisegraphset_highlightd)

### ExpertiseGraph~showLoadingScreen()
show/hide loading screen

**Kind**: inner method of [ExpertiseGraph](#markdown-header-expertisegraphinitconfig)  
### ExpertiseGraph~formatSOData(issueTagData,)
formats SO Data so it can be graphed

**Kind**: inner method of [ExpertiseGraph](#markdown-header-expertisegraphinitconfig)  

| Param | Description |
| --- | --- |
| issueTagData, | userCommitDataTags, TagCountServices |

#### formatSOData~countValues(ary,)
generates js obj of counts for tags in a array.

**Kind**: inner method of formatSOData  

| Param | Description |
| --- | --- |
| ary, | classifier |

### ExpertiseGraph~isConnected(a,)
is a connected to b

**Kind**: inner method of [ExpertiseGraph](#markdown-header-expertisegraphinitconfig)  

| Param | Description |
| --- | --- |
| a, | b |

### ExpertiseGraph~hasConnections(a)
does a have a connection?

**Kind**: inner method of [ExpertiseGraph](#markdown-header-expertisegraphinitconfig)  

| Param |
| --- |
| a | 

### ExpertiseGraph~tick()
step simulation forward

**Kind**: inner method of [ExpertiseGraph](#markdown-header-expertisegraphinitconfig)  
### ExpertiseGraph~set_highlight(d,)
highlight Multiple or single node.

**Kind**: inner method of [ExpertiseGraph](#markdown-header-expertisegraphinitconfig)  

| Param | Description |
| --- | --- |
| d, | showMany |

