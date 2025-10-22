PRTG HTTP API
PRTG includes a web-based "RESTful" API (Application Programming Interface) that enables external programs to access information from the monitoring database and to manipulate objects inside the database of PRTG.

In the context of the PRTG HTTP API the attribute "RESTful" essential means

that it is HTTP/HTTPS based
that it uses a set of "HTTP GET" URLs to access and manipulate the data and
that you'll get back an XML document in return (for most calls).
The PRTG HTTP API offers the following functionality:

Authentication, error handling and optional encryption
Functions for getting live object and status data as well as live graphs
Functions for getting historic sensor data and graphs
Functions for manipulating objects (e.g. edit, add, delete)
How do I use it?
All calls to the PRTG HTTP API are performed by HTTP GET requests. The URLs consist of a path to the API function and some parameters. Here are two example calls:

Sample Call 1:
http://yourserver/api/table.xml?content=sensortree
Sample Call 2:
http://yourserver/api/rename.htm?id=objectid&value=newname
The first part of the URL (/api/table.xml or /api/rename.htm) addresses an API function, here the functions that either render a table in XML format or rename an object. The second part after the question mark contains a number of parameters for additional control.

Important: PRTG expects all data in the GET parameters to be UTF-8 encoded and URL-encoded.

Authentication
All requests to the API are "stateless" which means that there is no multi-step login process of any kind. The authentication with username/passhash (or username/password) must always be included in each request by using the username and passhash (or username and password) parameters.

With these parameters the URLs will look like this:
http://yourserver/api/table.xml?content=sensors&columns=sensor&username=myuser&passhash=hash
or:
http://yourserver/api/table.xml?content=sensors&columns=sensor&username=myuser&password=mypassword
The passhash for a user account is shown on the user account settings page.

Or you can request the password hash for an account with an API call:
http://yourserver/api/getpasshash.htm?username=myuser&password=mypassword
Note: Make sure that username and password are URL-encoded.

Security and Encryption
If you are accessing the API inside your secure LAN you can simply use HTTP. In insecure environments (e.g. when accessing your PRTG server across the Internet) you should use HTTPS requests to make sure that your parameters and passwords are encrypted. This way all communication between the PRTG server and your client is encrypted by SSL encryption.

Versioning
Most XML replies from the API contain a <version> field that contains the program version and buildnumber of the server's PRTG installation. Your client must look at this version number and compare it to the version number that was used to develop the client. Do not accept version numbers older (smaller) than this one. You should display a warning to the user (or stop processing), if the version number differs by more than 0.1 (e.g. version 8.1 vs. 8.1) or more (e.g. version 7.x vs. 8.x), because API conventions or parameters may have changed between versions. As a rule of thumb newer versions of the same major version of PRTG will reply to API calls just as previous versions have.

Limitations
For every API call, the default limit of items is 500. If you want to receive more items per call, please add a count=xxx parameter with enough room for all sensors, e.g.

Error Handling
Depending on whether your API call was processed successfully or not the PRTG server will reply with the following HTTP status codes:

HTTP status Code	Meaning	Comments
200	OK	The API call was completed successfully, the XML response contains the result data
301	Moved Permanently	The API call was completed successfully and a new object was created (the redirection URL contains the new object id)
400	Bad Request	The API could not be completed successfully. The XML response contains the error message.
401	Unauthorized	The username/password credentials of your authentication can not be accepted.
For "400" error codes the error XML document will include the error message as follows:

<?xml version="1.0" encoding="UTF-8" ?>
<prtg>
<version>13.1.2.1462</version>
<error>Sorry, there is no object with the specified id.</error>
</prtg>