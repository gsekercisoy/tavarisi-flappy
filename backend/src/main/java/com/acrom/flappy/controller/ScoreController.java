package com.acrom.flappy.controller;

import com.acrom.flappy.model.Score;
import com.acrom.flappy.repository.ScoreRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ScoreController {

    private final ScoreRepository repo;

    public ScoreController(ScoreRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/scores")
    public List<Score> top() {
        return repo.findTop10ByOrderByScoreDesc();
    }

    @GetMapping("/scores/{player}")
    public Map<String, Object> forPlayer(@PathVariable String player) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("best", repo.findTop5ByPlayerOrderByScoreDesc(player));
        out.put("games", repo.countByPlayer(player));
        return out;
    }

    @PostMapping("/scores")
    @ResponseStatus(HttpStatus.CREATED)
    public Score submit(@Valid @RequestBody Score s) {
        s.id = null;
        if (s.player != null) {
            s.player = s.player.trim();
        }
        return repo.save(s);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalGames", repo.count());
        List<Score> top = repo.findTop10ByOrderByScoreDesc();
        out.put("bestScore", top.isEmpty() ? 0 : top.get(0).score);
        out.put("top", top);
        return out;
    }
}
