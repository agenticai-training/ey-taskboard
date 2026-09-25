package com.honeywell.taskboard.repository;

import com.honeywell.taskboard.model.TaskItem;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;

/**
 * Literal contains match. {@code %} and {@code _} in the query match themselves.
 */
public class TaskRepositoryImpl implements TaskRepositoryCustom {

    private static final String LIKE_ESCAPE = "!";

    @PersistenceContext
    private EntityManager entityManager;

    static String containsPattern(String q) {
        String escaped = q
                .replace(LIKE_ESCAPE, LIKE_ESCAPE + LIKE_ESCAPE)
                .replace("%", LIKE_ESCAPE + "%")
                .replace("_", LIKE_ESCAPE + "_");
        return "%" + escaped + "%";
    }

    @Override
    public List<TaskItem> findByOptionalStatusAndQuery(String status, String q) {
        String pattern = q == null ? null : containsPattern(q);
        String jpql = """
                select t from TaskItem t
                where (:status is null or t.status = :status)
                  and (:pattern is null
                       or lower(t.title) like lower(:pattern) escape '%s'
                       or (t.description is not null
                           and lower(t.description) like lower(:pattern) escape '%s')
                       or (t.assignee is not null
                           and lower(t.assignee) like lower(:pattern) escape '%s'))
                order by t.id
                """.formatted(LIKE_ESCAPE, LIKE_ESCAPE, LIKE_ESCAPE);
        return entityManager
                .createQuery(jpql, TaskItem.class)
                .setParameter("status", status)
                .setParameter("pattern", pattern)
                .getResultList();
    }
}
