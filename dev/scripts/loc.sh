#!/bin/bash

# Usage: `./loc.sh [<start_date> (default: 01-01-%Y)]`

# The list of authors whose names must be merged or who must be renamed.
# "<main name>:<name to be merged>"
merge_list=(
    "Adrian Richter:peb-adr"
    "Bastian Rihm:Intevation Common Account"
    "Joshua Sangmeister:jsangmeister"
    "Ludwig Reiter:reiterl"
    "Luisa Beerboom:luisa-beerboom"
    "Luisa Beerboom:Luisa"
    "Raimund Renkert:rrenkert"
    "Loki Elble:Elblinator"
)

merge_authors() {
    awk -v p1="$1" -v p2="$2" -F '|' '
        $2 ~ p1 {total+=$1; plus+=$3; minus+=$4; next}
        $2 ~ p2 {total+=$1; plus+=$3; minus+=$4; next}
        {print $0}
    END {printf(" %d | %s | %d | %d\n", total, p1, plus, minus) }' <<< "$list"
}

start_date=$(date +'01-01-%Y')
[[ -z $1 ]] || start_date=$1

list=$(while read -r author; do
    submodules=$(git submodule foreach --quiet git log --since="$start_date" \
        --numstat --pretty="%H" --author="^$author" |\
        awk 'NF==3 {plus+=$1; minus+=$2} END {printf("%d %d\n", plus, minus)}')
    main=$(git log --since="$start_date" --numstat --pretty="%H" --author="^$author" |\
        awk 'NF==3 {plus+=$1; minus+=$2} END {printf("%d %d\n", plus, minus)}')
    plus=$(( $(cut -d " " -f 1 <<< $submodules) + $(cut -d " " -f 1 <<< $main) ))
    minus=$(( $(cut -d " " -f 2 <<< $submodules) + $(cut -d " " -f 2 <<< $main) ))
    total=$((plus + minus))
    echo " $total | $author | $plus | $minus"
done <<< $(git submodule foreach --quiet git log --format='%aN' --since="$start_date" \
    | sort -u | sed 's/\[bot\]//g'))

# For authors who have several names...
for m in "${merge_list[@]}"; do
    list=$(merge_authors "$(cut -d ":" -f 1  <<< $m)" "$(cut -d ":" -f 2 <<< $m )")
done

echo "All changed lines per author since $start_date:"
printf "$list\n" | sort -nr | column --table-columns " TOTAL, AUTHOR, PLUS, MINUS" \
    --table-order " AUTHOR, TOTAL, PLUS, MINUS" -ts '|' -o '|'
