"""Pattern builder for literal task search. Does not touch a database."""

from repositories.task_repository import contains_pattern


def test_contains_pattern_treats_percent_and_underscore_as_literals():
    assert contains_pattern("50%") == "%50!%%"
    assert contains_pattern("a_b") == "%a!_b%"
    assert contains_pattern("100!") == "%100!!%"
