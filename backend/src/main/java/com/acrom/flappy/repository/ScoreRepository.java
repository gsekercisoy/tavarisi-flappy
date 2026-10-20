package com.acrom.flappy.repository;

import com.acrom.flappy.model.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, Long> {
    List<Score> findTop10ByOrderByScoreDesc();
    List<Score> findTop5ByPlayerOrderByScoreDesc(String player);
    long countByPlayer(String player);
}
