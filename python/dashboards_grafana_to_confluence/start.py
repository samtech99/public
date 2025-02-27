import json
import requests
from requests.auth import HTTPBasicAuth
from atlassian import Confluence
from json2table import convert
from datetime import datetime
from html5print import HTMLBeautifier


def alert_checker():
    """
    Read dashboards
    """

    file1 = open("authentication.ini", "r")
    Lines = file1.readlines()

    count = 0
    dateTimeObj = datetime.now()
    timestampStr = dateTimeObj.strftime("%d-%b-%Y (%H:%M:%S.%f)")

    for line in Lines:

        result = [x.strip() for x in line.split(",")]

        myToken = result[1]
        myUrl = result[0] + "/api/search?query=%"
        dashboards = requests.get(
            myUrl, auth=HTTPBasicAuth(result[1], result[2]), verify=False
        )
        # print(dashboards.json())
        count2 = 0
        for aa in dashboards.json():
            # print(aa)
            # print(count2)

            id = str(aa["uid"])
            title = str(aa["title"])
            slug = str(aa["slug"])
            url = str(aa["url"])

            dashboards2 = requests.get(
                result[0] + "/api/dashboards/uid/" + id,
                auth=HTTPBasicAuth(result[1], result[2]),
                verify=False,
            )

            json_formatted_str = json.dumps(dashboards2.json(), indent=2)

            data98 = json.loads(json_formatted_str)
            count3 = 0

            for cc in data98["dashboard"]["panels"]:
                # print (cc['title'])
                # print (cc['datasource'])

                if cc["title"] is None:
                    title2 = "NONE!"
                else:
                    title2 = cc["title"]

                if cc["datasource"] is None:
                    datasource2 = "NONE!"
                else:
                    datasource2 = cc["datasource"]

                if cc["type"] is None:
                    type = "NONE!"
                else:
                    type = cc["type"]

                new_data = {
                    "Panel_Titel": title2,
                    "Panel_Datasource": datasource2,
                    "Panel_Type": type,
                }
                count3 += 1

            new_data = {
                "Dashboard_Title": title,
                "URL": url,
                #"Slug": slug,
                "Panels": new_data,
            }

            # print (new_data)

            file2 = open("confluence.ini", "r")
            Lines2 = file2.readlines()

            for line2 in Lines2:

                result2 = [x2.strip() for x2 in line2.split(",")]

                confluence = Confluence(
                    url=result2[0],
                    username=result2[1],
                    password=result2[2],
                    verify_ssl=False,
                )

                json_object = new_data

                build_direction = "LEFT_TO_RIGHT"
                table_attributes = {"style": "width:100%"}
                html = convert(
                    json_object,
                    build_direction=build_direction,
                    table_attributes=table_attributes,
                )

                # print(html)

                PARENTID = result2[3]

                if result2[3] == 0:
                    PARENTID = None

                auth = HTTPBasicAuth("admin", "admin")

                if count == 0 and count2 == 0:
                    headers = {"Content-Type": "application/json"}
                    data2 = [
                        {
                            "id": result2[4],
                            "type": "page",
                            "title": result2[5],
                            "body": {
                                "storage": {
                                    "value": "&lt;p&gt;testNum&lt;/p&gt;",
                                    "representation": "storage",
                                }
                            },
                            "version": {"number": "5"},
                        }
                    ]

                    htmlstring = HTMLBeautifier.beautify(html, 4)
                    # print(htmlstring)
                    status = confluence.update_page(
                        parent_id=PARENTID,
                        page_id=result2[4],
                        title=result2[5],
                        body="<H1><B>Grafana Server Name: "
                        + result[0]
                        + "</B></H1><h2>"
                        + "Dashboard Name: "
                        + title
                        + "</h2><h3>"
                        + "Timestamp : "
                        + timestampStr
                        + "</h3>"
                        + htmlstring,
                    )
                else:
                    status = confluence.append_page(
                        type="page",
                        parent_id=PARENTID,
                        page_id=result2[4],
                        title=result2[5],
                        append_body="<H1><B>Grafana Server Name: "
                        + result[0]
                        + "</B></H1><h2>"
                        + "Dashboard Name: "
                        + title
                        + "</h2><h3>"
                        + "Timestamp : "
                        + timestampStr
                        + "</h3>"
                        + htmlstring,
                    )
                count2 += 1
                # print(status)
                # print(status.request.url)
                # print(status.request.body)
                # print(status.request.headers)

        count += 1


def is_ascii(s):
    return all(ord(c) < 128 for c in s)


if __name__ == "__main__":
    alert_checker()
