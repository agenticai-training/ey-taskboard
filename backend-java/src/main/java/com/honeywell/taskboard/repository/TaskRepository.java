package com.honeywell.taskboard.repository;

import com.honeywell.taskboard.model.TaskItem;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Data-access layer. Spring Data implements the CRUD methods.
 * Optional status and search live in {@link TaskRepositoryImpl}.
 */
public interface TaskRepository extends JpaRepository<TaskItem, Integer>, TaskRepositoryCustom {
}
