README

PYTHON script which reads the dashboards from grafana server 
and push it to a confluence page!


=====================================================


Requirements:

pip/pip3 install atlassian-python-api
pip/pip3 install json2table
pip/pip3 install html5print


=====================================================

Syntax authentication.ini:
Grafana-Server-URL, Username, Password

Example:
http://localhost1:3000, admin, admin
http://localhost2:3000, admin, admin

=====================================================

Syntax confluence.ini:
Confluence-URL, Username, Password, Parent-Page-ID, Page-ID, Page-Title

Example:
http://localhost:8090, admin, admin, 'None', 65689, dashboards


======================================================

How to get Confluence Page-ID or Parnent-ID:

https://confluence.atlassian.com/confkb/how-to-get-confluence-page-id-648380445.html


======================================================

Grafana curl Example:

curl -H "Authorization: Bearer eyJrIjoiZUZqUGRMbnZ0MklSOTZKazBscUMydWJ0cXdmSVl6cHAiLCJuIjoidGVzdDEiLCJpZCI6MX0=" http://127.0.0.1:3000/api/dashboards/home

curl -u admin:admin -X GET http://127.0.0.1:3000/api/search?query=%/
curl -u admin:admin -X GET http://127.0.0.1:3000/api/dashboards/uid/TXSTREZ

======================================================

Confluence curl Example:

curl -u admin:admin -X PUT -H 'Content-Type: application/json' -d "{'id': '65689', 'type': 'page', 'status': 'current', 'title': 'dashboards', 'extensions': {'position': 'none'}, '_links': {'webui': '/display/PROD/dashboards', 'edit': '/pages/resumedraft.action?draftId=65689&draftShareId=cb5145c3-0576-44ee-811f-3ed38283d5ae', 'tinyui': '/x/SgAB', 'self': 'http://localhost:8090/rest/api/content/65689'}, '_expandable': {'container': '/rest/api/space/PROD', 'metadata': '', 'operations': '', 'children': '/rest/api/content/65689/child', 'restrictions': '/rest/api/content/65689/restriction/byOperation', 'history': '/rest/api/content/65689/history', 'ancestors': '', 'body': 'Test', 'version': '', 'descendants': '/rest/api/content/65689/descendant', 'space': '/rest/api/space/PROD'}}" http://localhost:8090/rest/api/content/65689


