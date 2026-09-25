package com.honeywell.taskboard.repository;

import com.honeywell.taskboard.model.TaskItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Data-access layer. Spring Data implements the CRUD methods; the custom
 * query below handles optional status and search filters with stable ordering.
 */
public interface TaskRepository extends JpaRepository<TaskItem, Integer> {

    @Query("""
            select t from TaskItem t
            where (:status is null or t.status = :status)
              and (:q is null
                   or lower(t.title) like lower(concat('%', cast(:q as string), '%'))
                   or (t.description is not null
                       and lower(t.description) like lower(concat('%', cast(:q as string), '%')))
                   or (t.assignee is not null
                       and lower(t.assignee) like lower(concat('%', cast(:q as string), '%'))))
            order by t.id
            """)
    List<TaskItem> findByOptionalStatusAndQuery(
            @Param("status") String status, @Param("q") String q);
}
