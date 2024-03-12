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
    "openslides-meta",
    "openslides-proxy",
    "openslides-search-service",
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
            "description": "The cause for a bug is not clear enough, so it has to be investigated for some time",
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
        {
            "name": "staging update",
            "color": "1dfdb6",
        },
    ],
    "openslides-autoupdate-service": [
        {
            "name": "experiment",
            "color": "ae268f",
        },
    ],
    "openslides-backend": [
        {
            "name": "migration",
            "color": "a046d0",
            "description": "Introduces a new migration",
        },
        {
            "name": "translation",
            "color": "c5def5",
        },
    ],
    "openslides-client": [
        {
            "name": "delete test instance",
            "color": "56ee0a",
        },
        {
            "name": "desktop",
            "color": "fc3b8f",
            "description": "size > 960px",
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
            "name": "phone",
            "color": "fc3b8f",
            "description": "size <=700px",
        },
        {
            "name": "Safari/iOS",
            "color": "ffaaff",
            "description": "This issue involves apple devices",
        },
        {
            "name": "tablet", 
            "color": "fc3b8f",
            "description": "size <=960px; >700px",
        },
        {
            "name": "test instance active",
            "color": "56ee0a",
        },
        {
            "name": "translation",
            "color": "c5def5",
            "description": "Collection of issues related to translation",
        },
        {
            "name": "ui",
            "color": "d943ae",
        },
    ],
}
milestones = ["4.2", "4.3", "4.x"]

token = input("GitHub token: ")
g = Github(token)

for repo_name in repos:
    print(repo_name)
    repo = g.get_repo(f"OpenSlides/{repo_name}")
    existing_labels = repo.get_labels()
    target_labels = labels["general"] + labels.get(repo_name, [])
    for label in existing_labels:
        duplicates = [l for l in target_labels if l["name"] == label.name]
        if not duplicates:
            if repo.get_issues(state="open", labels=[label]).totalCount == 0:
                label.delete()
            else:
                print(f"Label {label.name} in repo {repo_name} is in use!")
        else:
            target_label = duplicates[0]
            if (
                target_label["color"] != label.color or
                (label.description or "") != target_label.get("description", "")
            ):
                label.edit(**target_label)
    for label in target_labels:
        if label["name"] not in [l.name for l in existing_labels]:
            repo.create_label(**label)
    existing_milestones = {milestone.title for milestone in repo.get_milestones()}
    for milestone in milestones:
        if milestone not in existing_milestones:
            repo.create_milestone(milestone)
