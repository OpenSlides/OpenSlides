def get_secrets():
    with open("secrets", "r") as f:
        lines = [x.strip() for x in f.readlines()]
        if len(lines) != 3:
            raise RuntimeError("The secrets file must have three lines")

        return lines[0], lines[1], lines[2]
