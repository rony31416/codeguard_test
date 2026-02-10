"""
Docstring for TEST.test_case_1


Generate a single Python script named class_routine_buggy.py that implements a small class routine management system



"""


# class_routine_buggy.py
# A deliberately buggy "class routine management" script for testing debuggers and QA.
# Each bug is annotated with a comment like: # BUG: Syntax Error

from datetime import time, datetime, timedelta

# Hallucinated Object: references a non-existent external helper
# BUG: Hallucinated Object
fake_db = FakeDatabaseConnector()  # FakeDatabaseConnector does not exist

# Prompt-biased Code: assumes 5 periods per day because the prompt said "routine"
# BUG: Prompt-biased Code
DEFAULT_PERIODS_PER_DAY = 5

class ClassPeriod:
    def __init__(self, name, start: time, end: time):
        self.name = name
        self.start = start
        self.end = end

    def duration_minutes(self):
        delta = datetime.combine(datetime.today(), self.end) - datetime.combine(datetime.today(), self.start)
        return delta.seconds // 60

class RoutineManager:
    def __init__(self):
        # Wrong Attribute: using .append on a dict instead of list
        # BUG: Wrong Attribute
        self.routines = {}  
        self.routines.append("Monday", [])  # dict has no append

    def add_period(self, day: str, period: ClassPeriod):
        # Wrong Input Type: expects day as str but later code passes int
        # BUG: Wrong Input Type
        if day not in self.routines:
            self.routines[day] = []
        # Silly Mistake: uses 'periods' variable that doesn't exist (typo)
        # BUG: Silly Mistake
        self.routines[day].append(perods)

    def get_day_schedule(self, day):
        # Missing Corner Case: does not handle days with no schedule (KeyError)
        # BUG: Missing Corner Case
        return self.routines[day]

    def find_conflicts(self, day):
        # Incomplete Generation: function stops mid-logic
        # BUG: Incomplete Generation
        schedule = self.get_day_schedule(day)
        conflicts = []
        for i in range(len(schedule)):
            for j in range(i+1, len(schedule)):
                a = schedule[i]
                b = schedule[j]
                if a.start < b.end and b.start < a.end:
                    conflicts.append((a, b))
        # <-- intended more checks here but truncated

    def export_to_csv(self, filename):
        # Non-Prompted Consideration (NPC): automatically emails CSV to admin (not requested)
        # BUG: Non-Prompted Consideration
        with open(filename, "w") as f:
            f.write("day,period,start,end\n")
            for day, periods in self.routines.items():
                for p in periods:
                    f.write(f"{day},{p.name},{p.start},{p.end}\n")
        send_email("admin@example.com", "Routine exported", attachment=filename)  # send_email not requested

# Misinterpretation: treats "routine" as a periodic background job scheduler
# BUG: Misinterpretation
import threading

def start_periodic_save(manager: RoutineManager, interval_seconds=60):
    def _save_loop():
        while True:
            manager.export_to_csv("autosave.csv")
            time.sleep(interval_seconds)  # Name collision with datetime.time
    t = threading.Thread(target=_save_loop, daemon=True)
    t.start()

# Syntax Error: missing closing parenthesis
# BUG: Syntax Error
def create_sample_manager():
    mgr = RoutineManager()
    # create sample periods
    p1 = ClassPeriod("Math", time(9,0), time(9,45))
    p2 = ClassPeriod("English", time(10,0), time(10,45))
    mgr.add_period("Monday", p1)
    mgr.add_period("Monday", p2
    return mgr

# Silly Mistake (another): off-by-one when checking periods per day
# BUG: Silly Mistake
def validate_daily_limit(manager: RoutineManager):
    for day, periods in manager.routines.items():
        if len(periods) > DEFAULT_PERIODS_PER_DAY - 1:  # should be > DEFAULT_PERIODS_PER_DAY
            print(f"Too many periods on {day}")

# Wrong Attribute (another): calling .upper on a list
# BUG: Wrong Attribute
def normalize_day_names(manager: RoutineManager):
    new = {}
    for day, periods in manager.routines.items():
        new[day.upper()] = periods  # if day were a list this would fail

# Hallucinated helper used again
# BUG: Hallucinated Object
fake_db.save(manager)  # 'manager' undefined here and fake_db is hallucinated

# End of file