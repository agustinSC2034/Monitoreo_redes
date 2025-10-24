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




Custom Sensors
Custom sensors allow a number of monitoring tasks that go far beyond the standard sensor set to be performed. Apart from parameterized versions of SNMP, packet sniffer and NetFlow sensors you can create your own sensors using WQL (WMI Query Language) and by compiling an EXE file, using any Windows software development tool.

The following documentation describes custom EXE/Script sensors. For more information about custom sensors based on SNMP, WMI, Packet Sniffing and xFlow please see the respective custom sensor types in the PRTG manual.

For each sensor interval PRTG can run an external process. The process can be a Windows EXE file, or a DLL, BAT, CMD, VBS or Powershell file, as well as an SSH script.

—Standard and Advanced EXE/Script Sensor
You must create the sensor as a file and place it in a specific folder on the system running the PRTG probe (i.e. if you are using remote probes the files must be copied to the remote system; in a PRTG cluster setup on each cluster node!):

Place executables (.EXE, .DLL), batchfiles (.CMD, .BAT), VBS scripts (.VBS), or PowerShell scripts (.PS1) into a sub folder of the PRTG program directory. For the "Standard EXE/Script Sensor", this is the following sub folder:

Custom Sensors\EXE
If your executable or script returns XML you will use them with the "Advanced EXE/Script Sensor". In this case, please store your files into the following sub folder:

Custom Sensors\EXEXML
You will find a sample set of demo sensors in these folders, too. As soon as a file is placed into the folders mentioned above, you can create or edit your own Custom EXE sensor and select the new file from the list of files.

The probe will then execute the file on the probe system using the account configured for the "PRTG Probe Service" ("system" is the default). The local probe will run the file on the local PRTG Core Server system. But for remote probes, the file will actually run on the remote system. If your custom sensor code relies on other files (eg. DLLs, .NET framework, Windows PowerShell etc.) you must copy/install these files onto the probe machine manually!

Note: EXE sensors will fail if they attempt to open any graphical user interface windows using the Win32 APIs (this is not allowed for processes that are started by a system service).

—Standard SSH Script Sensor
You must create the sensor as an SSH script and place it in a specific folder on the target system running your Linux/Unix installation where the script will be executed.

Place your SSH script files into the following directory of the target system:

/var/prtg/scripts
As soon as a file is placed into the folder mentioned above, you can create or edit your own SSH script sensor and select the new script file from the list of scripts.

With each scanning interval, PRTG will execute the script on the target system and receive the result as a sensor result.

Interface Definition for EXE/BAT/CMD/VBS/PowerShell/SSH Sensors
Every time the sensor is run, the selected file is executed. The string entered in the "parameter" field of the sensor's settings is used as command line (you can use placeholders, see below). The executable file must send the results to the Standard OUT. For the format of returned data please see below.

If the EXE does not return control to the PRTG process it is killed as soon as the timeout value set for this sensor is reached.

You can test the EXE file you want to use for the sensor very easily on the command line (cmd.exe). Simply start the EXE file and pipe the results into a file, e.g.:

sensorexe parameter > result.txt
The results are then written into the file result.txt and you can check the results with notepad or any other text editor.

Notes:

For PowerShell scripts, make sure that they may be executed by either signing the files or changing the security policy for Powershell.exe accordingly.
The API interface for custom EXE sensors is compatible to the custom EXE sensors provided by IPCheck Server Monitor 5.
Return Values for EXE/BAT/CMD/VBS/PowerShell/SSH Sensors
The expected return values are different, depending on the type of EXE/Script sensor used. The standard sensor needs a simple value:message pair; the advanced sensor processes an XML return value. When using the standard SSH Script sensor, it will expect returncode:value:message as result. See details below.

—Standard EXE/Script Sensor
The returned data for standard EXE/Script sensors must be in the following format:

value:message
Value has to be a 64 bit integer or float and will be used as the resulting value for this sensor (e.g. bytes, milliseconds, etc.), message can be any string and will be stored in the database.

The EXE's exit code has to be one of the following values:

Value	Description
0	OK
1	WARNING
2	System Error (e.g. a network/socket error)
3	Protocol Error (e.g. web server returns a 404)
4	Content Error (e.g. a web page does not contain a required word)
—Standard SSH Script Sensor
The returned data for standard SSH Script sensors must be in the following format:

returncode:value:message
Value has to be a 64 bit integer or float and will be used as the resulting value for this sensor (e.g. bytes, milliseconds, etc.), message can be any string and will be stored in the database.

The SSH script's "returncode" has to be one of the following values:

Value	Description
0	OK
1	WARNING
2	System Error (e.g. a network/socket error)
3	Protocol Error (e.g. web server returns a 404)
4	Content Error (e.g. a web page does not contain a required word)
—Advanced EXE/Script Sensor and Advanced SSH Script Sensor
The returned data for the EXE/Script Advanced and SSH Script Advanced sensors must be in XML format. Most parameters have a default value and are not required. The following minimum example leaves most parameters to their default values and returns two static channel values:

<prtg>
  <result>
    <channel>First channel</channel>
    <value>10</value>
  </result>
  <result>
    <channel>Second channel</channel>
    <value>20</value>
  </result>
</prtg>
To return an error, the format is:

<prtg>
  <error>1</error>
  <text>Your error message</text>
</prtg>
Note: Please find a more detailed demo script for the EXE/Script Advanced sensor in the Custom Sensors\EXEXML sub folder of your PRTG installation.

—Advanced EXE/Script and Advanced SSH Script sensors: Elements
You can optionally define the encoding of your XML file at the beginning of the document. For example, to define UTF-8, you would use:

<?xml version="1.0" encoding="UTF-8" ?>
The following elements can be used in the section between <result> and </result>. In each section you can return one sensor channel. Note: The tag names are not case sensitive, e.g. "VALUE" and "value" can both be used.

The following elements can be used in the section between <result> and </result>. In each section you can return one sensor channel. Note: The tag names are not case sensitive, e.g. "VALUE" and "value" can both be used.

Tag (Case Insensitive)	Mandatory	Description	Possible Content
<Channel>	X	Name of the channel as displayed in user interfaces. This parameter is required and must be unique for the sensor.	Any string
<Value>	X	The value as integer or float. Please make sure the <Float> setting matches the kind of value provided. Otherwise PRTG will show 0 values.	Integer or float value
<Unit>	—	The unit of the value. Default is Custom. Useful for PRTG to be able to convert volumes and times.	BytesBandwidth
BytesMemory
BytesDisk
Temperature
Percent
TimeResponse
TimeSeconds
Custom
Count
CPU (*)
BytesFile
SpeedDisk
SpeedNet
TimeHours
<CustomUnit>	—	If Custom is used as unit this is the text displayed behind the value.	Any string (keep it short)
<SpeedSize>
<VolumeSize>	—	Size used for the display value. E.g. if you have a value of 50000 and use Kilo as size the display is 50 kilo #. Default is One (value used as returned). For the Bytes and Speed units this is overridden by the setting in the user interface.	One
Kilo
Mega
Giga
Tera
Byte
KiloByte
MegaByte
GigaByte
TeraByte
Bit
KiloBit
MegaBit
GigaBit
TeraBit
<SpeedTime>	—	See above, used when displaying the speed. Default is Second.	Second
Minute
Hour
Day
<Mode>	—	Selects if the value is a absolut value or counter. Default is Absolute.	Absolute
Difference
<Float>	—	Define if the value is a float. Default is 0 (no). If set to 1 (yes), use a dot as decimal seperator in values. Note: Define decimal places with the <DecimalMode> element.	0 (= no, integer)
1 (= yes, float)
<DecimalMode>	—	Init value for the Decimal Places option. If 0 is used in the <Float> element (i.e. use integer), the default is Auto; otherwise (i.e. for float) default is All. Note: In the sensor's Channels tab, you can change this initial setting later.	Auto
All
<Warning>	—	If enabled for at least one channel, the entire sensor is set to warning status. Default is 0 (no).	0 (= no)
1 (= yes)
<ShowChart>	—	Init value for the Show in Chart option. Default is 1 (yes). Note: The values defined with this element will be considered only on the first sensor scan, when the channel is newly created; they are ignored on all further sensor scans (and may be omitted). In the sensor's Channels tab, you can change this initial setting later.	0 (= no)
1 (= yes)
<ShowTable>	—	Init value for the Show in Table option. Default is 1 (yes). Note: The values defined with this element will be considered only on the first sensor scan, when the channel is newly created; they are ignored on all further sensor scans (and may be omitted). In the sensor's Channels tab, you can change this initial setting later.	0 (= no)
1 (= yes)
<LimitMaxError>	—	Define an upper error limit for the channel. If enabled, the sensor will be set to a "Down" status if this value is overrun. Note: Please provide the limit value in the unit of the base data type, just as used in the <Value> element of this section. While a sensor shows a "Down" status triggered by a limit, it will still receive data in its channels. The values defined with this element will be considered only on the first sensor scan, when the channel is newly created; they are ignored on all further sensor scans (and may be omitted). In the sensor's Channels tab, you can change this initial setting later.	Integer
<LimitMaxWarning>	—	Define an upper warning limit for the channel. If enabled, the sensor will be set to a "Warning" status if this value is overrun. Note: Please provide the limit value in the unit of the base data type, just as used in the <Value> element of this section. The values defined with this element will be considered only on the first sensor scan, when the channel is newly created; they are ignored on all further sensor scans (and may be omitted). In the sensor's Channels tab, you can change this initial setting later.	Integer
<LimitMinWarning>	—	Define a lower warning limit for the channel. If enabled, the sensor will be set to a "Warning" status if this value is undercut. Note: Please provide the limit value in the unit of the base data type, just as used in the <Value> element of this section. The values defined with this element will be considered only on the first sensor scan, when the channel is newly created; they are ignored on all further sensor scans (and may be omitted). In the sensor's Channels tab, you can change this initial setting later.	Integer
<LimitMinError>	—	Define a lower error limit for the channel. If enabled, the sensor will be set to a "Down" status if this value is undercut. Note: Please provide the limit value in the unit of the base data type, just as used in the <Value> element of this section. While a sensor shows a "Down" status triggered by a limit, it will still receive data in its channels. The values defined with this element will be considered only on the first sensor scan, when the channel is newly created; they are ignored on all further sensor scans (and may be omitted). In the sensor's Channels tab, you can change this initial setting later.	Integer
<LimitErrorMsg>	—	Define an additional message. It will be added to the sensor's message when entering a "Down" status. Note: The values defined with this element will be considered only on the first sensor scan, when the channel is newly created; they are ignored on all further sensor scans (and may be omitted). In the sensor's Channels tab, you can change this initial setting later.	Any string
<LimitWarningMsg>	—	Define an additional message. It will be added to the sensor's message when entering a "Warning" status. Note: The values defined with this element will be considered only on the first sensor scan, when the channel is newly created; they are ignored on all further sensor scans (and may be omitted). In the sensor's Channels tab, you can change this initial setting later.	Any string
<LimitMode>	—	Define if the limit settings defined above will be active. Default is 1 (yes; limits active). If 0 is used the limits will be written to the sensor channel settings as predefined values, but limits will be disabled. Note: This setting will be considered only on the first sensor scan, when the channel is newly created; it is ignored on all further sensor scans (and may be omitted). In the sensor's Channels tab, you can change this initial setting later.	0 (= no)
1 (= yes)
(*) This is a % unit which in index graphs is acounted to the CPU load.

The following elements can be used in the section between <prtg> and </prtg>, outside the <result> section. Note: The tag names are not case sensitive, e.g. "TEXT" and "text" can both be used.

Tag (Case Insensitive)	Mandatory	Description	Possible Content
<Text>	—	Text the sensor returns in the Message field with every scanning interval. There can be one message per sensor, regardless of the number of channels. Default is OK. Note: This element has to be provided outside of the <result> element.	Any string;
Max. length: 2000 characters
<Error>	—	If enabled, the sensor will return an error status. This element can be combined with the <Text> element in order to show an error message. Default is 0. Note: This element has to be provided outside of the <result> element. A sensor in this error status cannot return any data in its channels; if used, all channel values in the <result> section will be ignored.	0 (= no)
1 (= yes, set sensor to error; ignore <result> section)
Notes:

Each run (sensor scan) may return either any number of channels (<result>...</result>) or one error response. It is not possible to mix result and error entries.
You can either write the XML output to standard OUT line by line, or give back the entire expression in one line without breaks.
Interface Definition for DLL Sensors
Every time the sensor is to be checked, a function in the selected DLL file is called. The DLL must export one function:

function perform(para,msg:pchar):integer; stdcall;
para and msg are zero terminated strings. The allocated buffer for msg is 255 bytes, the DLL must make sure that fewer bytes are returned. Msg must be in the following format:

value:message
Value has to be an 32 bit integer and will be used as the resulting value for this sensor (e.g. bytes, milliseconds, etc.), message can be any string and will be stored in the database.

The integer return value of the perform function has to conform to the same rules as the EXE exit code mentioned above.

Warning: If the function call in the DLL does not return control it could block the whole PRTG system. Make sure to handle your own timeouts and build in a reliable error management. For this reason EXE sensors are recommended.

Command Line Parameters
In the "parameter" field you can use the following placeholders:

Placeholder	Description
%sensorid	The ID of the EXE/Script sensor
%deviceid	The ID of the device the sensor is created on
%groupid	The ID of the group the sensor is created in
%probeid	The ID of the probe the sensor is created on
%host	The IP address/DNS name entry of the device the sensor is created on
%device	The name of the device the sensor is created on
%group	The name of the group the sensor is created in
%probe	The name of the probe the sensor is created on
%name or %sensor	The name of the EXE/Script sensor
%windowsdomain	The domain for Windows access (may be inherited from parent)
%windowsuser	The user name for Windows access (may be inherited from parent)
%windowspassword	The password for Windows access (may be inherited from parent)
%linuxuser	The user name for Linux access (may be inherited from parent)
%linuxpassword	The password for Linux access (may be inherited from parent)
%snmpcommunity	The community string for SNMP v1 (may be inherited from parent)
Please make sure you write the placeholders in quotes to ensure that they are working properly if their values contain blanks. Use single quotation marks ' ' with PowerShell scripts, and double quotes " " with all others.

Environment Values
If the Set placeholders as environment values option is enabled in the sensor's settings, the values of all placeholders available for command line parameters (see table above) are additionally provided as "Environment Variables" during runtime, so you can use them in your executable or script file. The variables' names are the same as for placeholders mentioned above, with a "prtg_" prefix and without the % character. For example, refer to the sensor's own name by using the variable prtg_name.

Additionally, the following variables are available:

Variable	Description
prtg_version	The version number of your PRTG installation
prtg_url	The IP address/DNS name of your PRTG installation
prtg_primarychannel	The ID of the sensor's current primary channel (1 if not set)
Links
Sample projects for these Custom sensors can be found:

In the "PRTG Network Monitor\custom sensors\EXE" subfolder of your PRTG installation.
In the Knowledge Base on the Paessler website at http://www.paessler.com/knowledgebase.
On the prtg-addons website on the open source platform Google Code: http://code.google.com/p/prtg-addons/




Custom Notifications
In addition to the various standard methods for notifications, you can also define your own notifications using HTTP actions, scripts, or EXE files. The possibilities of these “notifications” go far beyond just sending out messages, as you can perform almost any action you like whenever the notification is triggered.

The following documentation describes these custom notifications. Different notification methods can also be combined in one notification. For more general information about notifications based on e-mail, messaging, and others, please see Notifications in the PRTG manual.

Execute HTTP Action
This notification method sends any Postdata to a custom URL. You can execute specific actions on a web server or control any web service that accepts commands via one-time HTTP requests. Whenever a notification of this kind is triggered, the HTTP action is sent. With this method, you can also call any API function of your PRTG web interface. For example, you can set PRTG to automatically pause a sensor, or acknowledge an alarm.

For example, to automatically pause the sensor that triggers the notification, please enter the following HTTP action:

http://yourserver/api/pause.htm?id=%sensorid&action=0&username=myuser&password=mypassword
To use the notification to automatically acknowledge the alarm that triggered it, please enter this HTTP action:

http://yourserver/api/acknowledgealarm.htm?id=%sensorid&ackmsg=Auto-Acknowledged&username=myuser&password=mypassword
Please see the HTTP API tab for more information about authentication within the URL, and tab Object Manipulation for other possible actions you can configure.

Execute Program
With this notification method you can execute a script or a program as an external process. It can be a Windows executable file or a BAT, CMD, or Powershell file. You can use EXE, COM, BAT, CMD, VBS, or PS1 files.

You must create the notification as a file and place it in a specific folder on the system running the PRTG core server (when running a PRTG cluster setup, please copy the files to every node!).

Place executables (.EXE, .COM), batch files (.CMD, .BAT), VBS scripts (.VBS), or PowerShell scripts (.PS1) into the following sub folder of the PRTG program directory:

Notifications\EXE
As soon as a file is placed into the folder mentioned above, you can create or edit your own "Execute Program" notification and select the new file from the list of files. You can also enter start parameters and use PRTG’s placeholders for this.

Notes:

PRTG will then execute the file on the core system using the account configured for the "PRTG Core Service" ("system" is the default).
If your custom sensor code relies on other files (e.g. DLLs, .NET framework, Windows PowerShell etc.) you must copy/install these files onto the probe machine manually!
Please make sure that the return code of the executable is 0 (zero). Otherwise PRTG assumes something went wrong with the notification and will try to send it up to 3 times.
When running PRTG in a cluster, please copy the respective files to every single node to make sure the notification also works when the primary master is not reachable.
"Execute Program" notifications will fail if they attempt to open any graphical user interface windows using the Win32 APIs (this is not allowed for processes that are started by a system service).
Placeholders
For more information about the placeholders you can use, please see the Paessler Knowledge Base: What placeholders can I use with PRTG?.

More Information
For more information about custom notifications, please see the Paessler Knowledge Base, tag set "custom-notification".




Styling the Web Interface using CSS, JS and HTML Injection
PRTG users can use their own logos and/or corporate colors inside the AJAX Web GUI and Mini HTML (Login Form) by adding their own HTML and CSS code to PRTG's website. For the AJAX GUI it is also possible to add your own Javscript code, too.

Limited Support
This feature should only be used by experienced web designers with a good knowledge of HTML, Javascript and CSS. Due to the complexity of PRTG's code the Paessler Support can not support you regarding the actual HTML, Javascript and/or CSS code that you need to use. Please note that new versions of PRTG may render their web pages with a different HTML structure and may require changes for your CSS statements (but we will try to avoid such situations).

How does it work?
When webpages are created PRTG uses various include files from the folder \prtg network monitor\website\. You can add your own HTML, JS and CSS by editing one or more of the following files:

Folder/File	Interface	Contents	Will be inserted
\includes\htmlheader_customer.htm	AJAX Web GUI	HTML	at the top of the page, just after the <BODY> tag
\includes\htmlfooter_customer.htm	AJAX Web GUI	HTML	at the bottom of the page, just before the </BODY> tag
\css\customerstyles.css	AJAX Web GUI	CSS	at the end of PRTG's CSS file for the AJAX GUI
\javascript\customerscripts.js	AJAX Web GUI	Javascript	at the end of PRTG's Javascript file for the AJAX GUI
\includes\htmlheader_mini_customer.htm	Mini HTML (Login Form)	HTML	at the top of the page, just after the <BODY> tag
\includes\htmlfooter_mini_customer.htm	Mini HTML (Login Form)	HTML	at the bottom of the page, just before the </BODY> tag
\css\customerstyles_mini.css	Mini HTML (Login Form)	CSS	at the end of PRTG's CSS file for the HTML GUI
The contents of these files is then added at the respective positions. By creating these file and adding your own HTML and CSS statements (e.g. by using a text editor) you can append your own HTML and overwrite the built-in CSS statements to change PRTG's look and feel.

After adding/changing the file(s) a simple "full reload" of your browser window (Shift-F5) will instantly use the new code and you should be able to see the changes immediately.

Note: Please only modify the files mentioned above. Changing PRTG's build in HTML and CSS files is not recommended and not supported. All changes to PRTG's other files will be overwritten with new files as soon as a new PRTG version is installed.

Writing CSS Code
For some common redesign tasks (colors, logos, margins) we have included sample statements in the CSS code below. If you have additional design requirements we recommend that you use a tool like FireBug or any other web page analyzer tool to dig into PRTG's existing HTML code structure and CSS statements in order to find out what CSS statements you must add.

/* Sample CSS redesign file for PRTG Network Monitor, works with V7.2.x */
/* Created November 2009 by Dirk Paessler */

/* How to use: 
   - Create file "customerstyles.css" in the \prtg network monitor\website\css folder
   - insert the code below
   - reload your browser */

body, p, h1, h2, h3, h4, div, td, th, dd, input, select, textarea, button,.ui-button-text,.ui-widget,.ui-tabs .ui-tabs-nav li a 
{
  font-family:"Times New Roman",times,serif;
  font-size:10px;
}

body,html,.ui-widget-header,#head,.tabs-container, .logcontainer

{
  background:#F6F3D8;
}

#header
{
  background:#F0ECB8;
}

#menus
{
  background:#A09776;
}

#breadcrumbs
{
  background:#B6C2C0;
}

div.wizard > span
{
  background:#F0ECB8;
}

div.wizhead, div.wizard div.wizhead
{
  background:#C57456;
}

table.table tr.even td
{
  background:#F6F3D8;
}

#helpcontainer 
{
  background:#A3D5A9;
}

#breadcrumbs a div
{
  margin-top:2px;
  margin-bottom:2px;
  border:1px solid #A09776;
  padding-top:2px;
  padding-bottom:2px;
  height:10px;
  background-position:0 0;
}




Accessing Live Object Data and Live Status Data
Getting One Single Property or Status of an Object
You can get properties/settings of an object (name, hostname, url) as well as status information of an object (lastvalue, downtime) using the following API calls:

Get object property/setting (for propertyname look at the "name" of the INPUT fields while editing an object):
/api/getobjectproperty.htm?id=objectid&name=propertyname&show=text
Get object status (for columnname refer to the "Supported Output Columns" table below):
/api/getobjectstatus.htm?id=objectid&name=columnname&show=text
The XML result looks like this:

<?xml version="1.0" encoding="UTF-8" ?>
	<prtg>
	<version>13.1.2.1462</version>
	<result>True</result>
	</prtg>
Get details about a sensor (returns an XML):
/api/getsensordetails.xml?id=sensorid 
The XML result looks like this:

<?xml version="1.0" encoding="UTF-8"?>
<sensordata>
	<prtg-version>13.1.2.1462</prtg-version>
	<name>
		<![CDATA[Probe Health]]>
	</name>
	<sensortype>
		<![CDATA[Probe]]>
	</sensortype>
	<interval>
		<![CDATA[60 s]]>
	</interval>
	<probename>
		<![CDATA[PRTG]]>
	</probename>
	<parentgroupname>
		<![CDATA[PRTG]]>
	</parentgroupname>
	<parentdevicename>
		<![CDATA[Probe.Device.]]>
	</parentdevicename>
	<parentdeviceid>  
		<![CDATA[40]]>
	</parentdeviceid>
	<lastvalue>
		<![CDATA[99 %]]>
	</lastvalue>
	<lastmessage>
		<![CDATA[OK]]>
	</lastmessage>
	<favorite>
		<![CDATA[]]>
	</favorite>
	<statustext>
		<![CDATA[Up]]>
	</statustext>
	<statusid>
		<![CDATA[3]]>
	</statusid>
	<lastup>
		<![CDATA[40511.5501967593[20 s ago]]]>
	</lastup>
	<lastdown>
		<![CDATA[40511.5407662153[13 m 55 s ago]]]>
	</lastdown>
	<lastcheck>
		<![CDATA[40511.5501967593[20 s ago]]]>
	</lastcheck>
	<uptime>
		<![CDATA[99.9639%]]>
	</uptime>
	<uptimetime>
		<![CDATA[283 d 14 h]]>
	</uptimetime>
	<downtime>
		<![CDATA[0.0361%]]>
	</downtime>
	<downtimetime>
		<![CDATA[2 h 27 m 31 s]]>
	</downtimetime>
	<updowntotal>
		<![CDATA[283 d 16 h [=63% coverage]]]>
	</updowntotal>
	<updownsince>
		<![CDATA[40059.3436475810[452 d 4 h ago]]]>
	</updownsince>
</sensordata>
Getting Property or Status of Multiple Objects
Most data that you can request from the API is available in data tables in XML and CSV format (using XML format is recommended).

The API function /api/table.xml is used to access data in tables. Here are some sample calls (URLs are shown without authentication parameters to improve readability):

A hierarchical list of all groups, devices and sensors with their current state information (note: All other parameters except id= will be ignored):
/api/table.xml?content=sensortree
All sensors (with current status information):
/api/table.xml?content=sensors&columns=objid,group,device,sensor,status,message,lastvalue,priority,favorite
All recent log entries:
/api/table.xml?content=messages&columns=objid,datetime,parent,type,name,status,message
You will have the easiest start if you either use the query builder below or click the small XML icons  that most tables with data have in PRTG's web interface. Simply navigate to the information that you want to use, click the XML icon and you will be taken to a URL which renders the content of the table in XML format. You can now use the URL as it is or change various parameters (see parameter description below) to suit your needs.

Note: URLs only show the XML URLs, please use API function /api/table.csv or the "output" parameter to select CSV format.

PRTG HTTP API: XML Table Query Builder
You can use the following query builder tool to experiment with the API and to fine tune your queries. Please consult the information below for details:

XML Table Query BuilderPlease choose from the available contents for tablesTable Contentsensortree: A tree-like structure of groups, devices and sensors (XML only)groups: List of all groupsdevices: List of all devicessensors: List of all sensorsvalues: List of most recent results of a sensor (sensor ID required)channels: List of the channels of a sensor (sensor ID required)reports: List of reportsstoredreports: List of most recent PDF reports (report ID reqiured)todos: List of most recent todosmessages: List of most recent log entriesmaps: List of mapshistory: Recent configuration changes of an object
Table Typexml: most suitable for further processing (recommended)json: lightweight javascript object notationxmltable: structured like an HTML table (easier to convert into a table)csv: comma separated outputhtml: pure HTML
Comma delimited list of columns per record. Please see columnslist below for detailsColumns

Maximum number of items (default 500)Count

Start with this entry number (can be used with "count" to request the data page-by-page)Start

The table will only contain information for this object id and its child objects (all objects will be used if this parameter is omitted)Object ID


Run query and preview output


Output Data Format
XML data from PRTG's API interface contains the fields that you have requested in the "columns" parameter. In most cases numerical values will be included twice: One field contains the value in human readable format and an additional "RAW" field contains the value as a number, which is better suited for further processing and calculations. Look at the fields in the following sample:

<status>Up</status>
<status_RAW>3</status_RAW>
<lastvalue>98 %</lastvalue>
<lastvalue_RAW>97.7583</lastvalue_RAW>
<message>OK</message>
The "status" field shows the value "Up" (the according RAW value is "3")
The "lastvalue" field shows the value "98%" (the according RAW value is "97.7583")
The text field "message" is only shown once.
RAW Date/Time Format
For columns with date/time value the RAW value is defined as follows: The integral part of a value is the number of days that have passed since Dec 30th 1899. The fractional part of a value is fraction of a 24 hour day that has elapsed. To find the fractional number of days between two dates, simply subtract the two values. Similarly, to increment a date and time value by a certain fractional number of days, add the fractional number to the date and time value. Here are some examples of date/time RAW values and their corresponding dates and times:

RAW Date/Time Value	Description
0	12/30/1899 00h00m (12:00 midnight)
2.75	1/1/1900 18h00m (6:00 pm)
35065	1/1/1996 00h00m (12:00 midnight)
Common Data Table Parameters
The following parameters are common to all data table API calls:

Parameter	Description	Possible values
content	Selects what objects you want to have in your table	devices, sensors, todos, messages, values, channels, reports, storedreports
columns	Comma delimited list of columns per record	see list below
output	Controls the output format	"xml": default format (recommended)
"xmltable": a HTML table in XML format
"csvtable": comma separated format
"html": HTML table
count	Maximum number of items (default 500)	1-50000
start	Start with this entry number (can be used with "count" to request the data page-by-page)	any
Filtering by Object ID
Add an id parameter to the API URL in order to select a subset of items for the data table (e.g. in order to reduce the amount of data transferred for each data table API call). The data table will only contain information for this object id and its child objects. Some table types actually require an id. If the id parameter is omitted or has the value zero (0) all available objects will be used.

Table Type	Id required/optional	Description	Objects types allowed for the ID
content="sensortree"	optional	You will only get a part of the tree (the object with the given ID and all child objects below it).	Probe or group
content="sensors" or content="devices"	optional	You will only get the object with the given ID and all child objects below it.	Probe, group, or device
content="todos" or content="messages"	optional	You will only get log file entries (or todos) that apply to the object with the given ID or any child objects below it	Any object
content="values" or content="channels"	required	You will get the data values (or channels, respectively) of the sensor selected by the id	Sensor
content="reports"	not used	This data table will always include all reports	n/a
content="storedreports"	required	You will get a list of stored PDF files of the report selected by the id	report
Sorting and Advanced Filtering
There are various options to further filter the data and to sort the data for each data table API call:

Parameter	Description	Possible values
filter_drel	Only include records younger than this setting (for content="messages" only)	today, yesterday, 7days, 30days, 12months, 6months
filter_status	Only include sensors with a specific status (for content="sensors" only). Using multiple filter_status fields performs a logical OR.	Unknown=1, Collecting=2, Up=3, Warning=4, Down=5, NoProbe=6, PausedbyUser=7, PausedbyDependency=8, PausedbySchedule=9, Unusual=10, PausedbyLicense=11, PausedUntil=12, DownAcknowledged=13, DownPartial=14
filter_tags	Only include sensors with a specific tag (for content="sensors" only). Using multiple filter_tag fields performs a logical OR.	@tag(tagname)
filter_xyz	Filters the data. (Samples: filter_type=ping, filter_favorite=1). Using multiple filter_xyz fields performs a logical OR.	filter_xyz where xyz is any column name used in the columns parameter; Substrings: use filter_xyz=@sub(substring1,substring2); Values not equal/above/below: use filter_xyz=@neq(value), filter_xyz=@above(value), filter_xyz=@below(value)
sortby	Sorts the data. If this parameter is omitted the table will be sorted based on the first column. Add a leading "-" to reverse sort order. (Samples: sortby=name, sortby=lastvalue, sortby=-lastvalue, sortby=uptime)
any column name used in the columns parameter. Note: log tables with content="messages" or content="todos" are always sorted by descending date
Here are some samples for filtered API calls:

All sensors that are not up (with their current state and downtime information):
/api/table.xml?content=sensors&columns=objid,downtimesince,device,sensor,lastvalue,status,message,priority&filter_status=5&filter_status=4&filter_status=10&filter_status=13&filter_status=14&sortby=priority
Fastest PING sensors:
/api/table.xml?content=sensors&columns=objid,sensor,lastvalue,status,message&sortby=lastvalue&filter_type=ping
Log entries of the last 7 days for object id 2003:
/api/table.xml?content=messages&id=2003&start=0&filter_drel=7days&columns=objid,datetime,type,name,status,message
Supported Output Columns ("columns=" Parameter)
The following column names can be used for the "columns" parameter (separated by comma, e.g. "columns=objid,name,type").

Column Name	Description	Can be used for
objid	ID of the current object	all object tables
type	Displays the object type (group, device, report etc.) or, in case of sensors, the sensor type (ping, http, etc.)	all object tables
name	Name of the object or channel, or in case of log messages the name of the associated object, or in case of stored reports the name of the report file.	all object tables, channels, messages, storedreports
tags	List of all tags. This includes tags from the object itself plus those inherited from parent objects	all object tables
active	Displays true/false depending whether an object is set to paused by a user or whether a todo is acknowledged. For Notifications which are paused by schedule, the end of the schedule is also displayed	all object tables, todos
downtime	Cumulated downtime of a sensor (displayed as percentage of uptime+downtime)	sensors
downtimetime	Cumulated downtime of a sensor (in minutes/hours)	sensors
downtimesince	Elapsed time since last UP of a sensor	sensors
uptime	Cumulated uptime of a sensor (displayed as percentage of uptime+downtime)	sensors
uptimetime	Cumulated uptime of a sensor (in minutes/hours)	sensors
uptimesince	Elapsed time since last DOWN of a sensor	sensors
knowntime	Sum of cumulated uptime and downtime of a sensor	sensors
cumsince	Timestamp when accumulation of uptimes/downtimes began	sensors
sensor	Name of the sensor	sensors
interval	This displays the effective interval setting for a sensor	sensors
lastcheck	Timestamp of the last sensor result	sensors
lastup	Timestamp of the most recent UP status	sensors
lastdown	Timestamp of the most recent DOWN status	sensors
device	Name of the associated device	sensors, devices
group	Name of the associated group	sensors, devices, groups
probe	Name of the associated probe	sensors, devices, groups, probes
grpdev	Name of associated device and group seperated by slash	sensors, devices
notifiesx	Number of each trigger type defined for this sensor tree object	probes, groups, devices, sensors
intervalx	Displays either 'inherited' or the current interval setting of that object	probes, groups, devices, sensors
access	Displays the access rights of the current user for a sensor tree object	probes, groups, devices, sensors
dependency	Displays the name of an associated dependency or 'parent'	probes, groups, devices, sensors
probegroupdevice	Complete object hierarchy with names of associated device, group and probe seperated by slash. If more than one group is in the object hierarchy, these are displayed with '..'	sensor, device, group, probe
status	For sensor tree objects: status of the object (1=Unknown, 2=Scanning, 3=Up, 4=Warning, 5=Down, 6=No Probe, 7=Paused by User, 8=Paused by Dependency, 9=Paused by Schedule, 10=Unusual, 11=Not Licensed, 12=Paused Until); For messages/todos: category of the todo/log message	sensors, devices, groups, probes, messages, todos
message	Detailed message of a sensor tree object (i.e. last error of a sensor) or a history, log, todo entry	sensors, devices, groups, probes, messages, todos, history
priority	Displays the priority setting of a sensor tree object or the priority of a todo/log entry	sensors, devices, groups, probes, messages, todos
lastvalue	Last sensor result value or channel values. When used with channels the 'lastvalue_' has to be used to automatically display volumes and speed	sensors, channels
upsens	Number of sensors currently in UP state. Only the sensor itself or sensors in the hierarchy below the displayed object are counted	all sensors, devices, groups, probes
downsens	Number of sensors currently in DOWN state. Only the sensor itself or sensors in the hierarchy below the displayed object are counted	all sensors, devices, groups, probes
downacksens	Number of sensors currently in DOWN Acknowledged state. Only the sensor itself or sensors in the hierarchy below the displayed object are counted	all sensors, devices, groups, probes
partialdownsens	Number of sensors currently in Partial Down state. Only the sensor itself or sensors in the hierarchy below the displayed object are counted	all sensors, devices, groups, probes
warnsens	Number of sensors currently in WARNING state. Only the sensor itself or sensors in the hierarchy below the displayed object are counted	all sensors, devices, groups, probes
pausedsens	Number of sensors currently in a PAUSED state. This includes all PAUSED states (i.e. 'paused by user', 'paused by dependency, 'paused by schedule' etc.)	all sensors, devices, groups, probes
unusualsens	Number of sensors currently in UNUSUAL state. Only the sensor itself or sensors in the hierarchy below the displayed object are counted	all sensors, devices, groups, probes
undefinedsens	Number of sensors currently in UNDEFINED state. Only the sensor itself or sensors in the hierarchy below the displayed object are counted	all sensors, devices, groups, probes
totalsens	Number of sensors. Only the sensor itself or sensors in the hierarchy below the displayed object are counted	all sensors, devices, groups, probes
value	Should only be used as 'value_', because then it will be expanded for all visible channels/toplist columns. Displays a channel value or a toplist value	values, topdata
coverage	Displays the sensor coverage of a time span in a value table	values
favorite	Displays an exclamation mark when the sensor tree object is marked as favorite	sensors, devices, groups, probes
user	Displays the user responsible for a history entry	history
parent	Name of the parent object of the associated object of a log message	messages
datetime	Timestamp or timespan of an object	messages, todos, values, history, storedreports, topidx
dateonly	Like 'datetime' but only the date part	messages, todos, history, values
timeonly	Like 'datetime' but only the time part	messages, todos, history, values
schedule	For sensor tree objects this displays the name of an associated schedule, for reports ist displays the report generation schedule	probes, groups, devices, sensors, reports
period	Displays the period of a report (day, week etc.)	reports
email	Displays the email address of a report	reports
template	Displays the template used by a report	reports
lastrun	Timestamp of the last generation of a report	reports
nextrun	Timestamp of the next generation of a report	reports
size	Size of a stored report	storedreports
minigraph	Numerical data for the minigraphs. Numbers are 5 minute averages for the last 24 hours (must be scaled to the maximum of the series). There are two datasets: "|" separates measured value series and error series.	sensors
deviceicon	Device Icon	devices
comments	Objects Comments	all objects
host	Hostname or IP address	devices
condition	Probe status for probes, auto discovery status for groups	probes, groups
basetype	object type (string)	all tree objects
baselink	URL of the object	all tree objects
icon	URL of the device icon	devices
parentid	ID of the parent object	all tree objects
location	Location property (udes in Geo Maps)	groups, devices
fold	Subobjects are folded up (true) or down (false)	probes, groups
groupnum, devicenum	Number of groups/devices in a probe/group node	probes, groups
Requesting Current System Status
The following API call is a lightweight option to get status data like number of alarms, messages, etc.:

Current system status in XML format:
/api/getstatus.xml
Current system status in JSON format:
/api/getstatus.htm




Using Live Sensor Graphs from PRTG in other Webpages
Graphs are rendered as PNG files by PRTG and can be used in other webpages. The URL for a chart looks like this:

Live graph as PNG:
/chart.png?type=graph&width=300&height=160&graphid=2&id=0
Note that the URL does not start with /api. For authentication please add username and password/passhash to the URL, too. When placing these IMG URLs on webpages keep in mind that the URLs contain the account username and password/passhash. This can imply security concerns. It is recommended to set up a dedicated "read-only" user account in PRTG which is member of a dedicated user group that only has e.g. "read" priviledges for the root group and all underlying entries or - even better - only for the object ids that are used for graph URLs.

Parameters for Live Graph URLs (chart.png):
parameter	Description
type	Must be set to "graph"
graphid	Selects graph number (0=live, 1=last 48 hours, 2=30 days, 3=365 days)
width	Width of the image in pixels
height	Height of the image in pixels
id	The object ID of the desired graph object (usually the ID of a sensor object)
graphstyling	allows to control some graph styles:
Display legend: graphstyling=showLegend%3D%271%27
Hide legend: graphstyling=showLegend%3D%270%27
Control font size: graphstyling=baseFontSize%3D%27XX%27 (xx is the font size)
Control legend and font size at the same time: graphstyling=showLegend%3D%271%27+baseFontSize%3D%275%27
bgcolor	background color of PNG image, e.g. #ffffff (value must be URL encoded, i.e. %23ffffff)




Getting Historic Sensor Data
You can download the historic monitoring data for one sensor in XML or CSV format using the following API calls. You can either request the results of each single monitoring request (called raw data) or you can let PRTG calculate averages of the data (e..g. hourly or daily averages). To avoid potential server overload the number of requestable values per API call is limited by means of automatic averaging as follows:

Minimum Level of Detail (Average Interval)	Maximum Timeframe per API call
Raw data (all single monitoring requests)	For up to 40 days per API request
60 minutes/1 hour averages	40 to 500 days per API request
API Calls for Historic Data
The API calls for historic data tables look like this:

Historic data in XML format:
/api/historicdata.xml?id=objectid&avg=0&sdate=2009-01-20-00-00-00&edate=2009-01-21-23-59-59
Historic data in CSV format:
/api/historicdata.csv?id=objectid&avg=0&sdate=2009-01-20-00-00-00&edate=2009-01-21-23-59-59
The first URL will give you the data in XML format, the second URL will respond with CSV data. You must supply the object id of a sensor as well as a start date/time "sdate" and end date/time "edate".

API Call for Historic Graphs
Historic graphs are also available (in PNG format):

Historic Graph:
/chart.png?id=objectid&avg=15&sdate=2009-01-20-00-00-00&edate=2009-01-21-23-59-59&width=850&height=270&graphstyling=baseFontSize='12'%20showLegend='1'&graphid=-1
Common Parameters for Historic Data API Calls
The following parameters can be used for the graphs and the data tables:

Parameter	Description	Possible values
id	ID of the specific sensor	integer value
sdate	Start of the time span (date and time)	yyyy-mm-dd-hh-mm-ss
edate	End of the time span (date and time)	yyyy-mm-dd-hh-mm-ss
avg	Average interval in seconds; use 0 to download raw data (= results of all single monitoring requests)	integer value
width/height	Width and height of the graph in pixels	integer value
graphstyling	baseFontSize='x' sets the size of the font, showLegend='x' enables (1) or disables (0) the chart legend	baseFontSize='x'%20showLegend='x'
Historic Data Query Builder
Please use PRTG's historic data function to test drive this API function.



Changing Existing Objects
Use the following functions to manipulate existing objects (URLs are shown without username/passhash to improve readability):

Changing Object Settings
Rename an object:
/api/rename.htm?id=objectid&value=newname 
Set priority of an object (valid values for x are 1 to 5):
/api/setpriority.htm?id=objectid&prio=x 
Change properties of objects:
/api/setobjectproperty.htm?id=id_of_object&name=property_name&value=new_value 
This function can change most string and number properties of objects (names, numerical values, OIDs, etc.) and should be used with caution. The "property_name" parameter can be discerned by opening the "Settings" page of an object and looking at the HTML source of the INPUT fields. For example the INPUT field for the tags of an object has the name "tags_". Leave away the "_" and use the rest ("tags") as value for the "property_name" parameter.

Pausing/Resuming
Pause a sensor or object indefinitely:
/api/pause.htm?id=objectid&action=0 
Pause a sensor or object for x minutes:
/api/pauseobjectfor.htm?id=objectid&duration=x 
Pause and simulate an error state for a sensor:
/api/simulate.htm?id=objectid&action=1 
Resume monitoring of a sensor or object:
/api/pause.htm?id=objectid&action=1 
Error Handling, Rescanning
Acknowledge an error:
/api/acknowledgealarm.htm?id=objectid&ackmsg=yourmessage 
Rescanning, Triggering Auto-Discovery
Scan a sensor now:
/api/scannow.htm?id=objectid 
Run Auto Discovery for an object:
/api/discovernow.htm?id=objectid 
Setting Object Access Rights
You can set the access rights of a usergroup for an object with an API call. objectid is the id of the object (group, device, sensor, map). usergroupid is the id of the user group. accesslevel can have the following values:

-1: Inherited (actually removes access right setting for usergroupid from objectid and reenables access right inheritance)
0: No access (usergroup can not see the object, except as a parent in the device tree)
1: Read access (usergroup can view the object and settings)
2: Write access (usergroup can edit settings and create subobjects)
3: Full access (usergroup can set access rights)
Set the access rights of a usergroup for an object:
/api/setaccess.htm?id=objectid&usergroup=usergroupid&level=accesslevel 
Reordering Objects in the Sensor Tree
Move an object in the sensor tree (x can be "up", "down", "top", "bottom"):
/api/setposition.htm?id=objectid&newpos=x 
Report Related
Add a group, device or sensor to a report:
/api/reportaddsensor.htm?id=reportid&addid=objectid 
Notification Related
Test a notification:
/api/notificationtest.htm?id=objectid 
Adding/Deleting Objects
Adding and deleting objects in your PRTG configuration is the most complex and potentially most "dangerous" process when using the API. Keep in mind that add/delete activity is much better guided in the normal web interface with more warnings and alerts. It is recommended to use the web interface for such activity if possible.

Deleting Objects
API calls to the delete function immediately delete the referenced object including all subobjects, if there are any. E.g. deleting a group deletes all its devices and sensors! There is no way to undo a deletion so use this function with care.

Delete an object:
/api/deleteobject.htm?id=objectid&approve=1 
Adding Objects
Adding completely new objects "from scratch" is not supported via the API due to complexity of object creation and its parameters. To add new objects to PRTG please create a "master" object which will be cloned into new objects.

Note 1: If the "duplicateobject" succeeds the PRTG server will reply with a redirect to the URL of the new object (e.g. /sensor.htm?id=1234), your application should parse the new object ID from this URL.
Note 2: When an object is cloned it will initially be set to "paused" (so you have the chance to edit parameters as desired), you must resume it with an API call afterwards.
Duplicate a group:
/api/duplicateobject.htm?id=id_of_group_to_clone&name=new_name&targetid=id_of_target_group 
Duplicate a device:
/api/duplicateobject.htm?id=id_of_device_to_clone&name=new_name&host=new_hostname_or_ip&targetid=id_of_target_group
Duplicate a sensor:
/api/duplicateobject.htm?id=id_of_sensor_to_clone&name=new_name&targetid=id_of_target_device
Sample API Calls to Duplicate a Sensor and Change Clone's settings
The following process duplicates a sensor, changes some settings and the starts monitoring:

Duplicate the sensor (Server replies with a redirect to new objects webpage, e.g. /sensor.htm?id=10214, parse id 10214 from the URL):
/api/duplicateobject.htm?id=2002&name=mynewsensor&targetid=2001 
Rename the new sensor:
/api/setobjectproperty.htm?id=10214&name=name&value=anothernewname 
Change the OID (in this example for an SNMP Custom sensor):
/api/setobjectproperty.htm?id=10214&name=oid&value=1.2.3.4.5.6.7 
Resume monitoring for the new sensor:
/api/pause.htm?id=10214&action=1 



