#!/bin/bash

# Usage: `./loc.sh | sort -n` to get a sorted list of all changed lines.

for user in "Adrian Richter" "sangmeister" "Bastian Rihm" "Elblinator" "Emanuel Schütze" "reiter" "luisa" "Magnus Schieder" "Norman Jäckel" "Oskar Hahn" "Ralf Peschke" "Tobias Hößl" "rrenkert"; do
	submodules=$(git submodule foreach --quiet git log --since="01-01-2023" --numstat --pretty="%H" --author="$user" | awk 'NF==3 {plus+=$1; minus+=$2} END {printf("%d %d\n", plus, minus)}')
	main=$(git log --since="01-01-2023" --numstat --pretty="%H" --author="$user" | awk 'NF==3 {plus+=$1; minus+=$2} END {printf("%d %d\n", plus, minus)}')
	plus=$(( $(echo $submodules | cut -d " " -f 1) + $(echo $main | cut -d " " -f 1) ))
	minus=$(( $(echo $submodules | cut -d " " -f 2) + $(echo $main | cut -d " " -f 2) ))
	total=$((plus + minus))
	echo "$total $user: +$plus, -$minus"
done
