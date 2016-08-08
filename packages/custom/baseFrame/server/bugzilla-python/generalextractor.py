"""
General Extractor v2

** Diego Zamora Rodriguez **
** zamoraro@ualberta.ca **



This python3 script crawls the BugZilla platforms to read
and extract all the information related to the bugs that
are reported on these platforms

 - Mozilla
 - Eclipse
 - Kernel
 - LibreOffice

 To add more projects please add the urls and the
 XPATH directions (some of them are specified)
 to learn more about integrating more platforms to the
 system please check the TaskAssignment documentation



To install the dependencies use

  $ pip3 install -r requirements.txt

The commands to run this script are

 python3 generalextractor.py showservices,
 python3 generalextractor.py showprojects mozilla,
 python3 generalextractor.py mozilla aus

Example test

python3 generalextractor.py libreoffice libreoffice
python3 generalextractor.py mozilla aus
python3 generalextractor.py kernel acpi
python3 generalextractor.py eclipse birt


The first parameter is the service and the
 second one is the name of the project
    - Please notice that if the name of the project
      contains any space replace it with "%20"

"""

from lxml import html
from pymongo import MongoClient
import xml.etree.ElementTree as ET
import requests
import sys
import re
import pymongo

"""
Login information for the authentication on the service
The website doesn't provide the complete information if you aren't logged in
"""

USERNAME = "f1763724@mvrht.com"
PASSWORD = "uAlberta_2016"


LOGIN_URLS = {
    "eclipse": "https://bugs.eclipse.org/bugs/index.cgi",
    "mozilla": "https://bugzilla.mozilla.org/index.cgi",
    "libreoffice": "https://bugs.documentfoundation.org/index.cgi",
    "kernel": "https://bugzilla.kernel.org/",
}

BASE_URLS = {
    "eclipse": "https://bugs.eclipse.org/bugs/",
    "mozilla": "https://bugzilla.mozilla.org/",
    "libreoffice": "https://bugs.documentfoundation.org/",
    "kernel": "https://bugzilla.kernel.org/",
}

COMPONENTS_URL = {
    "eclipse": "https://bugs.eclipse.org/bugs/describecomponents.cgi",
    "mozillafull": "https://bugzilla.mozilla.org/describecomponents.cgi?full=1",
    "mozilla": "https://bugzilla.mozilla.org/describecomponents.cgi",
    "libreoffice": "https://bugs.documentfoundation.org/describecomponents.cgi",
    "kernel": "https://bugzilla.kernel.org/describecomponents.cgi",
}

BUGS_URL = {
    "eclipse": "https://bugs.eclipse.org/bugs/show_bug.cgi?ctype=xml&id=",
    "mozilla": "https://bugzilla.mozilla.org/show_bug.cgi?ctype=xml&id=",
    "libreoffice": "https://bugs.documentfoundation.org/show_bug.cgi?ctype=xml&id=",
    "kernel": "https://bugzilla.kernel.org/show_bug.cgi?ctype=xml&id=",
}

HISTORY_URLS = {
   "eclipse": "https://bugs.eclipse.org/bugs/show_activity.cgi?id=",
   "mozilla": "https://bugzilla.mozilla.org/show_activity.cgi?id=",
   "libreoffice": "https://bugs.documentfoundation.org/show_activity.cgi?id=",
   "kernel": "https://bugzilla.kernel.org/show_activity.cgi?id=",
}

PROFILE_URLS = {
    "eclipse": "https://bugs.eclipse.org/bugs/show_bug.cgi?id=",
    "mozilla": "https://bugzilla.mozilla.org/show_bug.cgi?id=",
    "libreoffice": "https://bugs.documentfoundation.org/show_bug.cgi?id=",
    "kernel": "https://bugzilla.kernel.org/show_bug.cgi?id=",
}

PREFIX = {
    "eclipse": "EC",
    "mozilla": "MZ",
    "libreoffice": "LO",
    "kernel": "KN"
}


class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

if sys.argv[2] != "showservices" and sys.argv[2] != "showprojects":
    service = LOGIN_URLS[sys.argv[2]]
    LOGIN_URL = service
else:
    LOGIN_URL = "https://bugzilla.mozilla.org/index.cgi"

# Authentication server
# Get Token
session_requests = requests.session()
result = session_requests.get(LOGIN_URL)
tree = html.fromstring(result.text)
authenticity_token = tree.xpath("//input[@name='Bugzilla_login_token']/@value")

# Create payload
payload = {
    "Bugzilla_login": USERNAME,
    "Bugzilla_password": PASSWORD,
    "Bugzilla_login_token": authenticity_token
}

# Database settings
client = MongoClient("localhost")
# access database objects (name of the database)
db = client[sys.argv[1]]  # db = client.primer

"""
   Main method to handle the parameters passed and
   start the process of extraction
"""
def main(parameters):

    service = parameters[2]

    if service == "showservices":
        showservices()
    elif service == "showprojects":
        project = parameters[3]
        showprojects(project)
    else:
        project = parameters[3]

        db.bugzillaprojects.insert_one({'_id': service + '/' + project})

        getBugs(service, getComponent(service, project))
    return 0


"""
    Prints to console the services
    available by looping trough
    the main dictionary of URL's
"""
def showservices():
    for i in BASE_URLS:
        print(i)


"""
    This method shows the list of projects available for
    each component on the system and is printed to the console
"""
def showprojects(service):
    if service == "mozilla":
        service = "mozillafull"
    url = COMPONENTS_URL[service]
    page = requests.get(url)
    # change to authenticated
    tree = html.fromstring(page.content)
    # selects all the products within the table"
    products = tree.xpath('//th//a/text() | //td/h2/a/text()')

    for i in range(len(products)):
        print(products[i].replace("\xa0", " "))


"""
    This method performs the authenticated extraction
    of information for each url that is requested
"""
def authRequest(url):
    # performs login
    result = session_requests.post(LOGIN_URL, data=payload, headers=dict(referer=LOGIN_URL))
    # scrape url
    r = session_requests.get(url, headers=dict(referer=url))
    return r.text


"""
    Reads the product (project) url and then crawls
    the website to obtain the list of bugs for each
    component in the website
"""
def getComponent(service, product):
    list_components = COMPONENTS_URL[service] + "?product=" + product
    url = list_components
    url = '%20'.join(url.split())
    page = authRequest(url)  # change to authenticated
    tree = html.fromstring(page)
    components = tree.xpath('//div[@class="component_name"]/a/@href | //td[@class="component_name"]/a/@href')
    return components


"""
    This methods obtains the complete list of bug's IDs  for each component
    by obtaining the href link to each of them and them
    calling the parseInformation method to save the data extracted with
"""
def getBugs(service, list):
    # Get the auth ready
    for i in range(len(list)):
        print(bcolors.BOLD + "New list of bugs gotten from a new component" + bcolors.ENDC)
        list[i] = list[i].replace("&resolution=---", "")
        # remove the line above if you only want to retrieve info in the website
        url = BASE_URLS[service] + list[i]
        page = session_requests.get(url, headers=dict(referer=url))
        tree = html.fromstring(page.content)
        bugs = tree.xpath('//input[@name="id"]/@value')

        # divide by two because there are two lists exactly same structured
        s = int(len(bugs) / 2)
        bugs = bugs[:s]
        auxlist = ','.join(bugs)

        list_bugs = BUGS_URL[service] + auxlist
        print(list_bugs)

        saveBugs(service, authRequest(list_bugs))


"""
    This method receives the service and the data
    in XML format to read it, parse every bug and
    then save each of them to the database
"""
def saveBugs(service, data):

    root = ET.fromstring(data)

    for bug in root.findall('bug'):
        if str(bug.attrib) == "{}":
            id = bug.find('bug_id').text
            title = bug.find('short_desc').text
            url = BUGS_URL[service] + id
            severity = bug.find('bug_severity').text
            status = bug.find('bug_status').text
            classification = bug.find('classification').text
            component = bug.find('component').text
            createdTime = bug.find('creation_ts').text
            assigneeEmail = bug.find('assigned_to').text

            cc = []
            if str(bug.find('cc')) == "None":
                cc = "None"
            else:
                for i in bug.findall('cc'):
                    cc.append(i.text)
            cc = str(cc)
            op_sys = bug.find('op_sys').text
            version = bug.find('version').text
            product = bug.find('product').text
            platform = bug.find('rep_platform').text
            updatedAt = bug.find('delta_ts').text

            commentid = ""
            summary = ""
            date = ""

            for c in bug.findall('long_desc'):
                for comment in c:
                    if comment.tag == "bug_when":
                        date = comment.text
                    if comment.tag == "thetext":
                        summary = str(comment.text)
                        notabs = re.sub('\t', " ", summary)
                        nobacks = re.sub('(?:\r\n|\r|\n)', " ", notabs)
                        noweird = re.sub('[\x00-\x1F\x7F-\x9F]', " ", nobacks)
                        summary = noweird
                    if comment.tag == "commentid":
                        commentid = comment.text
                saveComment(service, id, commentid, date, summary)

            extractHistory(service, id)
            saveUsers(service, id)

            # save to database

            bug = {
                    "_id": PREFIX[service] + id,
                    "title": title,
                    "body": saveFirstComment(service, id),
                    "status": status,
                    "labels": [],
                    "createdAt": createdTime,
                    "author": bug.find('reporter').text,
                    "closedBy": "",
                    "closedAt": "",
                    "url": url,
                    "updatedAt": updatedAt,
                    "parsed": False,
                    "tags": []
                  }

            bugzillabug = {
                "_id": PREFIX[service] + id,
                "severity": severity,
                "bugId": PREFIX[service] + id,
                "service": service,
                "asignee": assigneeEmail,
                "ccUsers": cc,
                "classification": classification,
                "component": component,
                "version": version,
                "platform": platform,
                "product": product,
                "op_sys": op_sys,
                "project": service + '/' + product,
            }

            # make the insertion
            db.bugzillabugs.insert_one(bugzillabug)
            db.bugs.insert_one(bug)

            print(bcolors.OKGREEN + "Bug " + id + " info saved to DB" + bcolors.ENDC)
        else:
            print("=== Bug not defined ===")
            print(bcolors.FAIL+"Bug wasn't saved! \nCheck the names"+bcolors.ENDC)


"""
    This method saves all the user's comments
    on the bug to the database
"""
def saveComment(service, bugid, commentnumber, date, comment):

    mozilla_bugs_comments = db.bugzillacomments

    bugCommentSchema = {
        "bugId": PREFIX[service] + bugid,
        "commentNumber": commentnumber,
        "date": date,
        "comment": comment,
        "service": service
    }

    mozilla_bugs_comments.insert(bugCommentSchema)


"""
    Aux method that retrieves the first comment of a bug
     by web scrapping the bug page
"""
def saveFirstComment(service, bugid):
    url = PROFILE_URLS[service] + bugid
    website = authRequest(url)

    tree = html.fromstring(website)
    xpath = '//pre[@id="comment_text_0"]/text()'
    firstcomment = tree.xpath(xpath)
    try:
        fc = firstcomment[0]
    except IndexError as e:
        return ""
    return firstcomment[0]


"""
    This method performs the history extraction of a given
    service and the bugid and saves the info to the db
"""
def extractHistory(service, bugid):
    url = HISTORY_URLS[service] + bugid
    website = authRequest(url)

    tree = html.fromstring(website)
    xpath = '//tr/td[position() = 1 or position() = 2  or position() = 3 or position() = 4 or position() = 5]/text()'
    components = tree.xpath(xpath)

    j = 0
    auxList = []
    for i in range(2, len(components)):
        components[i] = components[i].strip()
        auxList.append(components[i])
        j += 1
        if j % 5 == 0:
            historySchema = {
                "bugId": PREFIX[service] + bugid,
                "who": auxList[0],
                "when": auxList[1],
                "what": auxList[2],
                "removed": auxList[3],
                "added": auxList[4]
            }
            mbh = db.bugzillabugshistory
            mbh.insert(historySchema)
            auxList = []


"""
    This method gets the id of a bug
    and extracts the users related
    including in the cc list
"""
def saveUsers(service, bugid):
    url = PROFILE_URLS[service] + bugid
    website = authRequest(url)

    tree = html.fromstring(website)
    xpath = '//a[@class="email"]/@title'
    components = tree.xpath(xpath)

    for user in components:
        if user != "":
           try:
            name = user[0:user.index("[")]
           except ValueError as e:
               name = "Nobody"

           try:
               email = user[user.index("<")+1: user.index(">")]
           except ValueError as e:
               email = "nobody@mozilla.org"
           else:
               a = ""

           try:
            username = user[user.index(":")+1:user.index("]")]
           except ValueError as e:
               username = "nobody"

           BUS = {
               "_id": email,
               "name": name,
               "username": username
           }

           mui = db.bugzillaprofiles
           try:
             mui.insert(BUS)
           except pymongo.errors.DuplicateKeyError as e:
             print("User already exists!")


if __name__ == '__main__':
    main(sys.argv)
