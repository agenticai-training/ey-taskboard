package com.honeywell.taskboard.repository;

import com.honeywell.taskboard.model.TaskItem;
import java.util.List;

/**
 * Search query that Spring Data cannot express as a derived finder.
 * {@link TaskRepositoryImpl} owns the JPQL.
 */
public interface TaskRepositoryCustom {

    List<TaskItem> findByOptionalStatusAndQuery(String status, String q);
}
