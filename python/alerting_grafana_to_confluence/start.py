import json
import requests
from requests.auth import HTTPBasicAuth
from atlassian import Confluence
from json2table import convert
from datetime import datetime
from html5print import HTMLBeautifier


def alert_checker():
    """
    Read alerts
    """

    file1 = open("authentication.ini", "r")
    Lines = file1.readlines()

    count = 0
    dateTimeObj = datetime.now()
    timestampStr = dateTimeObj.strftime("%d-%b-%Y (%H:%M:%S.%f)")

    for line in Lines:

        result = [x.strip() for x in line.split(",")]

        myToken = result[1]
        myUrl = result[0] + "/api/alerts"
        alerts = requests.get(myUrl, auth=HTTPBasicAuth(result[1], result[2]), verify=False)
        # print(alerts.json())
        count2 = 0
        for aa in alerts.json():
            # print(aa)
            # print(count2)

            # id = str(alerts.json()[count]["id"] + count2)
            id = str(aa["id"])
            alerts2 = requests.get(
                myUrl + "/" + id, auth=HTTPBasicAuth(result[1], result[2]), verify=False
            )

            json_formatted_str = json.dumps(alerts2.json(), indent=2)
            # print(json_formatted_str)

            # Confluence page insert
            file2 = open("confluence.ini", "r")
            Lines2 = file2.readlines()

            for line2 in Lines2:

                result2 = [x2.strip() for x2 in line2.split(",")]

                confluence = Confluence(
                    url=result2[0], username=result2[1], password=result2[2], verify_ssl=False
                )

                json_object = alerts2.json()
                build_direction = "LEFT_TO_RIGHT"
                table_attributes = {"style": "width:100%"}
                html = convert(
                    json_object,
                    build_direction=build_direction,
                    table_attributes=table_attributes,
                )
                # print(html)

                PARENTID = result2[3]
                htmlstring = HTMLBeautifier.beautify(html, 4)

                if result2[3] == 0:
                    PARENTID = None

                if count == 0 and count2 == 0:
                    status = confluence.update_page(
                        parent_id=PARENTID,
                        page_id=result2[4],
                        title=result2[5],
                        body="<H1><B>Grafana Server Name: "
                        + result[0]
                        + "</B></H1><h2>"
                        + "Timestamp : "
                        + timestampStr
                        + "</h2>"
                        + htmlstring,
                    )
                else:
                    status = confluence.append_page(
                        parent_id=PARENTID,
                        page_id=result2[4],
                        title=result2[5],
                        append_body="<H1><B>Grafana Server Name: "
                        + result[0]
                        + "</B></H1><h2>"
                        + "Timestamp : "
                        + timestampStr
                        + "</h2>"
                        + htmlstring,
                    )
                count2 += 1
                # print(status)

        count += 1


if __name__ == "__main__":
    alert_checker()
