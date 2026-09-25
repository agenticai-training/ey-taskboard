package com.honeywell.taskboard.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TaskRepositoryImplTest {

    @Test
    void containsPatternTreatsPercentAndUnderscoreAsLiterals() {
        assertThat(TaskRepositoryImpl.containsPattern("50%")).isEqualTo("%50!%%");
        assertThat(TaskRepositoryImpl.containsPattern("a_b")).isEqualTo("%a!_b%");
        assertThat(TaskRepositoryImpl.containsPattern("100!")).isEqualTo("%100!!%");
    }
}
