"""
General Extractor

This python3 script crawls the BugZilla platforms to read
and extract all the information related to the bugs that
are reported on these platforms

 - Mozilla
 - Eclipse

 To add more projects please add the urls and the
 XPATH directions (some of them are specified)
 to learn more about integrating more platforms to the
 system please check the documentation


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


"""

from lxml import html
from pymongo import MongoClient
import xml.etree.ElementTree as ET
import requests
import json
import sys
import re
import datetime
import pymongo

"""
Login information for the authenticacion on the service
The website doesn't provide the complete information if you aren't logged in
"""

USERNAME = "f1763724@mvrht.com"
PASSWORD = "uAlberta_2016"

PROFILE_URL = "https://bugzilla.mozilla.org/rest/user?names="

HISTORY_URL = "https://bugzilla.mozilla.org/rest/bug/"


login_urls = {
    "eclipse": "https://bugs.eclipse.org/bugs/index.cgi",
    "mozilla": "https://bugzilla.mozilla.org/index.cgi",
    "libreoffice": "https://bugs.documentfoundation.org/index.cgi",
    "kernel": "https://bugzilla.kernel.org/",
}

urls = {
    "eclipse": "https://bugs.eclipse.org/bugs/",
    "mozilla": "https://bugzilla.mozilla.org/",
    "libreoffice": "https://bugs.documentfoundation.org/",
    "kernel": "https://bugzilla.kernel.org/",
}

componentsURL = {
        "eclipse": "https://bugs.eclipse.org/bugs/describecomponents.cgi",
        "mozillafull": "https://bugzilla.mozilla.org/describecomponents.cgi?full=1",
        "mozilla": "https://bugzilla.mozilla.org/describecomponents.cgi",
        "libreoffice": "https://bugs.documentfoundation.org/describecomponents.cgi",
        "kernel": "https://bugzilla.kernel.org/describecomponents.cgi",
        }

bugurl = {
    "eclipse": "https://bugs.eclipse.org/bugs/show_bug.cgi?ctype=xml&id=",
    "mozilla": "https://bugzilla.mozilla.org/show_bug.cgi?ctype=xml&id=",
    "libreoffice": "https://bugs.documentfoundation.org/show_bug.cgi?ctype=xml&id=",
    "kernel": "https://bugzilla.kernel.org/show_bug.cgi?ctype=xml&id=",
}

prefix = {
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


if sys.argv[1] != "showservices" and sys.argv[1] != "showprojects":
    service = login_urls[sys.argv[1]]
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
client = MongoClient("162.246.157.171")
# access database objects (name of the database)
db = client['mean-prod']  # db = client.primer

"""
   Main method to handle the parameters passed and
   start the process of extraction
"""


def main(parameters):

    p1 = parameters[1]
    p2 = ""

    if p1 == "showservices":
        showservices()
    elif p1 == "showprojects":
        p2 = parameters[2]
        showprojects(p2)
    else:
        p2 = parameters[2]

        service = p1
        project = p2

        print(bcolors.WARNING + "Extracting information from " + service + " in the project " + project+"..." +bcolors.ENDC)
        readauxlist(service, getComponent(service, project))
    return 0


"""
Reads the product (project) url and then crawls
 the website to obtain the list of bugs

"""


def getComponent(service, product):
    auxList = []

    list_components = componentsURL[service] + "?product=" + product

    print(list_components)

    url = list_components
    url = '%20'.join(url.split())
    page = readlistofbugs(url)  # change to authenticated
    tree = html.fromstring(page)
    components = tree.xpath('//div[@class="component_name"]/a/@href | //td[@class="component_name"]/a/@href')
    print(components)
    auxList.append(components)
    return auxList


def readlistofbugs(url):
    result = session_requests.post(LOGIN_URL, data=payload, headers=dict(referer=LOGIN_URL))
    r = session_requests.get(url, headers=dict(referer=url))
    return r.text


def readauxlist(service, list):
    # Get the auth ready
    for i in range(len(list)):
        for j in range(2, (len(list[i]))):
            url = urls[service]+list[i][j]
            page = session_requests.get(url, headers=dict(referer=url))
            # page = requests.get(url)
            tree = html.fromstring(page.content)

            # selects all the inputs with attribute name="id"
            bugs = tree.xpath('//input[@name="id"]/@value')
            # divide by two because there are two lists exactly same structured
            s = int(len(bugs)/2)
            bugs = bugs[:s]
            auxlist = ','.join(bugs)

            # this must be changed for supporting more bugzilla repositories
            print(bcolors.BOLD+"New list of bugs gotten from a new component"+bcolors.ENDC)
            list_bugs = bugurl[service] + auxlist
            print(list_bugs)
            parseinformation(service, readlistofbugs(list_bugs))


def parseinformation(service, data):
    root = ET.fromstring(data)

    for bug in root.findall('bug'):
        if str(bug.attrib) == "{}":
            id = bug.find('bug_id').text
            title = bug.find('short_desc').text
            url = bugurl[service] + id
            severity = bug.find('bug_severity').text
            status = bug.find('bug_status').text
            classification = bug.find('classification').text
            component = bug.find('component').text
            createdTime = bug.find('creation_ts').text
            assigneeEmail = bug.find('assigned_to').text
            parseUser(bug.find('reporter').text)
            parseHistory(bug.find('bug_id').text)
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
                for comment in c:  #bug.find('long_desc'):
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

            parsecomments(service, id, commentid, date, summary)

            # save to database

            bug = {
                    "_id": prefix[service] + id,
                    "title": title,
                    "body": summary,
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
                "_id": prefix[service] + id,
                "severity": severity,
                "bugId": prefix[service] + id,
                "service": service,
                "asignee": assigneeEmail,
                "ccUsers": cc,
                "classification": classification,
                "component": component,
                "version": version,
                "platform": platform,
                "product": product,
                "op_sys": op_sys
            }

            # make the insertion
            bb = db.bugzillabugs
            b = db.bugs

            try:
                rbb = bb.insert_one(bugzillabug).inserted_id
                rb = b.insert_one(bug).inserted_id
                print(rb)
            except pymongo.errors.DuplicateKeyError as e:
                print(str(e))

            print(bcolors.OKGREEN + "Bug "+id+" info saved to DB" + bcolors.ENDC)
        else:
            print("=== Bug not defined ===")
            print(bcolors.FAIL+"Bug wasn't saved! \nCheck the names"+bcolors.ENDC)


def parsecomments(service, bugid, commentnumber, date, comment):

    mozilla_bugs_comments = db.bugzillacomments

    bugCommentSchema = {
        "bugId": bugid,
        "_id": prefix[service]+commentnumber,
        "date": date,
        "comment": comment,
        "service": service
    }

    mozilla_bugs_comments.insert(bugCommentSchema)

"""
This methods saves the users information using the service api
"""

def parseUser(email):
    profileurl = PROFILE_URL+email
    profilepage = requests.get(profileurl)
    saveUser(profilepage.text)


def saveUser(data):
    j = json.loads(data)

    try:
        a = j["users"]
    except KeyError as e:
        #print(e)
        return
    except IndexError as i:
        print(str(i)+" User not saved")
        return

    info = j["users"][0]

    id = info["id"]
    name = info["name"]
    real_name = info["real_name"]
    profile = {
                "_id": id,
                "email": name,
                "realName": real_name,
                "createdAt": datetime.datetime.utcnow()
              }
    # make the insertion
    bp = db.bugzillaprofiles
    try:
        pf = bp.insert_one(profile).inserted_id
        #print(pf)
    except pymongo.errors.DuplicateKeyError as e:
        print(str(e))
        return


def parseHistory(bugid):
    historyUrl = HISTORY_URL + bugid + "/history"
    history = requests.get(historyUrl)
    saveHistory(history.text)


def saveHistory(data):
    j = json.loads(data)
    bugschanges = j["bugs"][0]

    # save the data to the database
    bugid = bugschanges["id"]
    for i in bugschanges["history"]:
        bugwhen = i["when"]
        bugwho = i["who"]
        bughistory = i["changes"]
        historyobject = {
            "_id": bugid,
            "when": bugwhen,
            "who": bugwho,
            "history": bughistory
        }
        collection = db.bugzillabugshistory
        collection.update({'_id': bugid}, {'$set': historyobject}, upsert=True)
        #print(a)

"""
Prints to console the services
available by looping trough
the main dictionary of URL's
"""


def showservices():
    for i in urls:
        print(i)

"""
Th
"""


def showprojects(service):
    url = componentsURL[service]
    page = requests.get(url)
    # change to authenticated
    tree = html.fromstring(page.content)
    # selects all the products within the table"
    products = tree.xpath('//th//a/text() | //td/h2/a/text()')

    for i in range(len(products)):
        print(products[i].replace("\xa0", " "))


if __name__ == '__main__':
    main(sys.argv)
