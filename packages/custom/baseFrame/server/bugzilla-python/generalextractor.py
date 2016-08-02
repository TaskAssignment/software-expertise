from lxml import html
from pymongo import MongoClient
import xml.etree.ElementTree as ET
import requests
import json
import sys
import re
import datetime
import pymongo
# showservices, showprojects mozilla, mozilla aus

USERNAME = "c4736290@trbvn.com"
PASSWORD = "uAlberta_2016"
LOGIN_URL = "https://bugzilla.mozilla.org/index.cgi"
PROFILE_URL = "https://bugzilla.mozilla.org/rest/user?names="
HISTORY_URL = "https://bugzilla.mozilla.org/rest/bug/"

# Authentication server
# Get Token
session_requests = requests.session()
result = session_requests.get(LOGIN_URL)
tree = html.fromstring(result.text)
authenticity_token = tree.xpath("//input[@name='Bugzilla_login_token']/@value")

# Database settings
client = MongoClient("162.246.157.171")
# access database objects (name of the database)
db = client['mean-prod']  # db = client.primer

# Create payload
payload = {
    "Bugzilla_login": USERNAME,
    "Bugzilla_password": PASSWORD,
    "Bugzilla_login_token": authenticity_token
}

urls = {
        "eclipse": "https://bugs.eclipse.org/bugs/describecomponents.cgi",
        "mozilla": "https://bugzilla.mozilla.org/describecomponents.cgi?full=1",
        "libreoffice": "https://bugs.documentfoundation.org/describecomponents.cgi",
        "kernel": "https://bugs.kernel.org/describecomponents.cgi",
        }

class BugList:
    eclipse = "https://bugs.eclipse.org/bugs/describecomponents.cgi"
    mozillafull = "https://bugzilla.mozilla.org/describecomponents.cgi?full=1"
    mozilla = "https://bugzilla.mozilla.org/describecomponents.cgi"
    libreoffice = "https://bugs.documentfoundation.org/describecomponents.cgi"
    kernel = "https://bugs.kernel.org/describecomponents.cgi"


class BugExtract:
    eclipse = "https://bugs.eclipse.org/bugs/show_bug.cgi?ctype=xml&id="
    mozilla = "https://bugzilla.mozilla.org/show_bug.cgi?ctype=xml&id="
    libreoffice = "https://bugs.documentfoundation.org/show_bug.cgi?ctype=xml&id="
    kernel = "https://bugzilla.kernel.org/show_bug.cgi?ctype=xml&id="


class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def main(parameters):
    #print(bcolors.OKBLUE + "Welcome to the bug extractor" + bcolors.ENDC)

    noparameters = len(parameters)

    p1 = parameters[1]
    p2 = parameters[2]

    if p1 == "showservices":
        showservices()
    elif p2 == "showprojects":
        showprojects(p2)
    else:
        if noparameters < 2:
            if noparameters == 1:
                service = p1
                print(bcolors.WARNING+"Extracting all the information from  "+service+"..."+bcolors.ENDC)
                readauxlist(getlistofproducts(service))
            elif noparameters == 0:
                print(bcolors.FAIL + "How to run - Example \"python3 bugextractor.py mozilla firefox\"" + bcolors.ENDC)
        else:
            service = p1
            project = p2
            print(bcolors.WARNING + "Extracting information from " + service + " in the project " + project+"..." +bcolors.ENDC)
            readauxlist(getComponent(service, project))
    return 0


def getlistofproducts(service):

    url = urls[service]

    page = requests.get(url)
    # change to authenticated
    tree = html.fromstring(page.content)
    # selects all the products within the table"
    products = tree.xpath('//th//a/text() | //td/h2/a/text()')

    if service == "eclipse":
        return getComponents("eclipse", products)
    elif service == "mozilla":
        return getComponents("mozilla", products)
    elif service == "kernel":
        #return getComponents("kernel", products)
        print("This resource is in development and isn't ready yet")
    elif service == "libreoffice":
        #return getComponents("libreoffice", products)
        print("This resource is in development and isn't ready yet")


def getComponents(service, products):
    auxList = []
    print(bcolors.WARNING+"Projects found are"+bcolors.ENDC)
    for i in range(len(products)):
        list_components = ""
        if service == "eclipse":
            list_components = BugList.eclipse + "?product=" + products[i]
            print(list_components)
        elif service == "mozilla":
            list_components = BugList.mozilla + "?product=" + products[i]
            print(list_components)
        elif service == "kernel":
            list_components = BugList.kernel + "?product=" + products[i]
        elif service == "libreoffice":
            list_components = BugList.libreoffice + "?product=" + products[i]

        url = list_components
        url = '%20'.join(url.split())
        page = readlistofbugs(url)  # change to authenticated
        tree = html.fromstring(page)
        components = tree.xpath('//div[@class="component_name"]/a/@href | //td[@class="component_name"]/a/@href')
        auxList.append(components)
    return auxList


def getComponent(service, product):
    auxList = []
    list_components = ""
    if service == "eclipse":
        list_components = BugList.eclipse + "?product=" + product
    elif service == "mozilla":
        list_components = BugList.mozilla + "?product=" + product
    elif service == "kernel":
        list_components = BugList.kernel + "?product=" + product
    elif service == "libreoffice":
        list_components = BugList.libreoffice + "?product=" + product

    url = list_components
    url = '%20'.join(url.split())
    page = readlistofbugs(url)  # change to authenticated
    tree = html.fromstring(page)
    components = tree.xpath('//div[@class="component_name"]/a/@href | //td[@class="component_name"]/a/@href')
    auxList.append(components)
    return auxList


def readlistofbugs(url):
    result = session_requests.post(LOGIN_URL, data=payload, headers=dict(referer=LOGIN_URL))
    r = session_requests.get(url, headers=dict(referer=url))
    return r.text


def readauxlist(list):
    # Get the auth ready
    for i in range(len(list)):
        for j in range(2, (len(list[i]))):
            url = "https://bugzilla.mozilla.org/"+list[i][j]
            page = session_requests.get(url, headers=dict(referer=url))
            # page = requests.get(url)
            tree = html.fromstring(page.content)

            # selects all the inputs with attribute name="id"
            bugs = tree.xpath('//input[@name="id"]/@value')
            # divide by two because there are two lists exactly same structured
            s = int(len(bugs)/2)
            bugs = bugs[:s]
            # this must be changed for supporting more bugzilla repositories
            auxlist = ','.join(bugs)

            print(bcolors.BOLD+"New list of bugs gotten from a new component"+bcolors.ENDC)
            list_bugs = BugExtract.mozilla + auxlist
            print(list_bugs)
            parseinformation("mozilla", readlistofbugs(list_bugs))


def parseinformation(filename, data):
    root = ET.fromstring(data)

    for bug in root.findall('bug'):
        if str(bug.attrib) == "{}":
            id = bug.find('bug_id').text
            title = bug.find('short_desc').text
            url = "https://bugzilla.mozilla.org/show_bug.cgi?id="+id
            severity = bug.find('bug_severity').text
            status = bug.find('bug_status').text
            classification = bug.find('classification').text
            component = bug.find('component').text
            createdTime = bug.find('creation_ts').text
            assigneeEmail = bug.find('assigned_to').text

            parseUser(bug.find('reporter').text)
            parseHistory(bug.find('bug_id').text)
            cc = []
            if str(bug.find('cc'))=="None":
                cc = "None"
            else:
                for i in bug.findall('cc'):
                    cc.append(i.text)
            cc = str(cc)
            op_sys = bug.find('op_sys').text
            version = bug.find('version').text
            product = bug.find('product').text
            platform = bug.find('platform')

            commentid = ""
            summary = ""
            date = ""

            for comment in bug.find('long_desc'):
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

            parsecomments("mozilla_comments", id, commentid, date, summary)

            # save to database

            bug = {"_id": "BZ"+id,
                   "title": title,
                   "body": summary,
                   "status": status,
                   "labels": [],
                   "createdAt": createdTime,
                   "author": bug.find('reporter').text,
                   "closedBy": "",
                   "closedAt": "",
                   "url": url,
                   "updatedAt": datetime.datetime.utcnow(),
                   "parsed": False,
                   "tags": []
                  }

            bugzillabug = {
                "_id": id,
                "severity": severity,
                "bugId": 'BZ' + id,
                "asignee": assigneeEmail,
                "ccUsers": cc,
                "classification": classification,
                "component": component,
                "version": version,
                "platform": platform,
                "product": product,
                "summary": summary
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

            print(bcolors.OKGREEN + "Bug "+id+" info saved to TSV files" + bcolors.ENDC)
        else:
            print("=== Bug not defined ===")
            print(bcolors.FAIL+"Bug wasn't saved! \nCheck the names"+bcolors.ENDC)


def parsecomments(filename, bugid, commentnumber, date, comment):

    mozilla_bugs_comments = db.bugzillacomments

    bugCommentSchema = {
        "bugid": bugid,
        "commentnumber": commentnumber,
        "date": date,
        "comment": comment
    }

    mozilla_bugs_comments.insert(bugCommentSchema)


def parseUser(email):
    # method to find Users using the email find at the reporter
    profileurl = PROFILE_URL+email
    profilepage = requests.get(profileurl)
    saveUser(profilepage.text)


def saveUser(data):
    j = json.loads(data)

    try:
        a = j["users"]
    except KeyError as e:
        print(e)
        return
    except IndexError as i:
        print(str(i)+" User not saved")
        return

    info = j["users"][0]

    id = info["id"]
    name = info["name"]
    real_name = info["real_name"]
    profile = {"_id": id,
               "email": name,
               "realName": real_name,
               "createdAt": datetime.datetime.utcnow()}
    # make the insertion
    bp = db.bugzillaprofiles
    try:
        pf = bp.insert_one(profile).inserted_id
        print(pf)
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
    #print(bugschanges)
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
            "histoyr": bughistory
        }
        collection = db.bugzillabugshistory
        a = collection.update({'_id': bugid}, {'$set': historyobject}, upsert=True)
        print(a)

def showservices():
    services = []
    services.append("mozilla")
    services.append("eclipse")
    print(services)


def showprojects(service):
    print("Projects from "+service)
    url = ""
    if service == "eclipse":
        url = BugList.eclipse
    elif service == "mozilla":
        url = BugList.mozilla
    elif service == "kernel":
        url = BugList.kernel
    elif service == "libreoffice":
        url = BugList.libreoffice

    page = requests.get(url)
    # change to authenticated
    tree = html.fromstring(page.content)
    # selects all the products within the table"
    products = tree.xpath('//th//a/text() | //td/h2/a/text()')
    productsaux = []
    for i in range(len(products)):
        productsaux.append(products[i].replace("\xa0"," "))

    print(productsaux)
    return products


if __name__ == '__main__':
    main(sys.argv)
