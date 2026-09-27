import base64, json, os, sys, urllib.request

TOKEN = os.environ["VERCEL_TOKEN"]
API = "https://api.vercel.com"
SITE = os.path.expanduser("~/workspace/aimaxxi-site")
FILES = ["index.html", "icon.png", "favicon.png", "memes.jpg", "lockup.png", "hero-bg.jpg",
         "enlist.js", "og.png",
         "cards/compute.html", "cards/compute.png",
         "cards/intelligence.html", "cards/intelligence.png",
         "cards/agents.html", "cards/agents.png",
         "cards/robots.html", "cards/robots.png",
         "cards/energy.html", "cards/energy.png",
         "cards/memes.html", "cards/memes.png"]
TEAM_ID = "team_4LdhU9CgojF88iSArTiNSLVu"

def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(API + path, data=data, method=method,
                               headers={"Authorization": "Bearer " + TOKEN,
                                        "Content-Type": "application/json"})
    with urllib.request.urlopen(r) as resp:
        return json.load(resp)

proj = req("GET", f"/v9/projects/aimaxxi?teamId={TEAM_ID}")
print("project:", proj["name"], proj["id"])

payload_files = []
for f in FILES:
    with open(os.path.join(SITE, f), "rb") as fh:
        payload_files.append({"file": f,
                              "data": base64.b64encode(fh.read()).decode(),
                              "encoding": "base64"})

dep = req("POST", f"/v13/deployments?teamId={TEAM_ID}", {
    "name": "aimaxxi",
    "project": proj["id"],
    "target": "production",
    "files": payload_files,
    "projectSettings": {"framework": None},
})
print("deployment:", dep.get("id"), dep.get("status"), dep.get("url"))
sys.stdout.flush()
