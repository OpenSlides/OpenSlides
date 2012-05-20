Benchmark test script für OpenSlides
------------------------------------

usage: bench.py [-h] [-d DELAY] [-j JOBS] [-p PAUSE] [-r REPEAT]
                [-s {home,projector,agenda,application}]
                base_url


Optionen:
 -j JOBS   Anzahl der zu startenden Clients

 -d DELAY  Pause zwischen dem Start der einzelnen Unterprozesse in ms
           (negativer Wert: zufällige Wartezeit zwischen 0 und abs($wert)).

 -p PAUSE  "Denkpause" zwischen den einzelnen Requests (ms).

 -r REPEAT Anzahl der Wiederholungen der Requests (jeweils pro Unterprozess/Job)

 -s URLSET Angabe der abzufragenden URLs

 Basisurl wird als positional Argument angegeben.


Beispiel:
  $ python bench.py -j 100 -d 50 -r 100 -s projector http://127.0.0.1:8000
