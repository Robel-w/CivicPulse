package com.civicpulse.backend.repository;

import com.civicpulse.backend.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByUserId(Long userId);
    List<Feedback> findByCategory(String category);
    List<Feedback> findBySector(String sector);

    List<Feedback> findByLatitudeBetweenAndLongitudeBetween(Double minLat, Double maxLat, Double minLng, Double maxLng);
    List<Feedback> findByCategoryAndLatitudeBetweenAndLongitudeBetween(String category, Double minLat, Double maxLat, Double minLng, Double maxLng);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT f FROM Feedback f LEFT JOIN FETCH f.user u LEFT JOIN FETCH f.messages m WHERE u.username = :username OR m.user.username = :username")
    List<Feedback> findInvolvedFeedback(@org.springframework.data.repository.query.Param("username") String username);
}
