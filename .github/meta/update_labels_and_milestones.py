from github import Github


repos = [
    "OpenSlides",
    "openslides-auth-service",
    "openslides-autoupdate-service",
    "openslides-backend",
    "openslides-client",
    "openslides-datastore-service",
    "openslides-icc-service",
    "openslides-manage-service",
    "openslides-media-service",
    "openslides-vote-service",
    "vote-decrypt",
]

labels = {
    "general": [
        {
            "name": "blocker",
            "color": "fbca04",
        },
        {
            "name": "bug",
            "color": "b60205",
        },
        {
            "name": "clean up",
            "color": "c5def5",
        },
        {
            "name": "critical",
            "color": "000000",
            "description": "Highest priority: This has to be done first."
        },
        {
            "name": "dependencies",
            "color": "c5def5",
        },
        {
            "name": "documentation",
            "color": "c5def5",
        },
        {
            "name": "enhancement",
            "color": "006b75",
            "description": "General enhancement which is neither bug nor feature"
        },
        {
            "name": "feature",
            "color": "0e8a16",
        },
        {
            "name": "good first issue",
            "color": "5319e7",
        },
        {
            "name": "high",
            "color": "d93f0b",
        },
        {
            "name": "low",
            "color": "fbca04",
        },
        {
            "name": "needs discussion",
            "color": "c5def5",
        },
        {
            "name": "needs info",
            "color": "c5def5",
        },
        {
            "name": "needs investigation",
            "color": "e99695",
        },
        {
            "name": "performance",
            "color": "006b75",
        },
        {
            "name": "tests",
            "color": "1d76db",
        },
        {
            "name": "waiting",
            "color": "cccccc",
            "description": "Waiting for some other PR/feature; more details in comments"
        },
    ],
    "OpenSlides": [
        {
            "name": "help wanted",
            "color": "d4c5f9",
        },
        {
            "name": "meta",
            "color": "1d76db",
        },
        {
            "name": "OpenSlides 3",
            "color": "006b75",
        },
        {
            "name": "OpenSlides 4",
            "color": "317796",
        },
        {
            "name": "question",
            "color": "c5def5",
        },
    ],
    "openslides-backend": [
        {
            "name": "migration",
            "color": "a046d0",
        },
    ],
    "openslides-client": [
        {
            "name": "delete test instance",
            "color": "56ee0a",
        },
        {
            "name": "difficulty: easy",
            "color": "fef2c0",
        },
        {
            "name": "difficulty: hard",
            "color": "fef2c0",
        },
        {
            "name": "difficulty: normal",
            "color": "fef2c0",
        },
        {
            "name": "need test instance",
            "color": "56ee0a",
        },
        {
            "name": "Safari/iOS",
            "color": "ffaaff",
        },
        {
            "name": "test instance active",
            "color": "56ee0a",
        },
        {
            "name": "translation",
            "color": "c5def5",
        },
    ],
}
milestones = ["4.1", "4.x"]

token = input("GitHub token: ")
g = Github(token)


for repo_name in repos:
    print(repo_name)
    repo = g.get_repo(f"OpenSlides/{repo_name}")
    existing_labels = repo.get_labels()
    target_labels = labels["general"] + labels.get(repo_name, [])
    for label in existing_labels:
        issues = repo.get_issues(state="open", labels=[label])
        duplicates = [l for l in target_labels if l["name"] == label.name]
        if not duplicates:
            if issues.totalCount == 0:
                label.delete()
            else:
                print(f"Label {label.name} in repo {repo_name} is in use!")
        else:
            if (
                duplicates[0]["color"] != label.color or
                (isinstance(label.description, str) and duplicates[0].get("description") != label.description) or
                (not isinstance(label.description, str) and duplicates[0].get("description"))
            ):
                if "description" in duplicates[0]:
                    label.edit(duplicates[0]["name"], duplicates[0]["color"], duplicates[0]["description"])
                else:
                    label.edit(duplicates[0]["name"], duplicates[0]["color"])
    for label in target_labels:
        if label["name"] not in [l.name for l in existing_labels]:
            if "description" in label:
                repo.create_label(label["name"], label["color"], label["description"])
            else:
                repo.create_label(label["name"], label["color"])
    for milestone in milestones:
        try:
            repo.create_milestone(milestone)
        except:
            print(f"Milestone {milestone} in repo {repo_name} already exists!")
