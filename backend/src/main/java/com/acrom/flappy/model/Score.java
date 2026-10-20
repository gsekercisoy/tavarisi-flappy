package com.acrom.flappy.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import javax.persistence.*;
import javax.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scores")
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("id")
    public Long id;

    @NotBlank
    @Size(min = 1, max = 20)
    @Column(nullable = false, length = 20)
    @JsonProperty("player")
    public String player;

    @Min(0)
    @Max(100000)
    @Column(nullable = false)
    @JsonProperty("score")
    public int score;

    @Min(0)
    @Max(100000)
    @JsonProperty("pipes")
    public int pipes = 0;

    @JsonProperty("createdAt")
    public LocalDateTime createdAt = LocalDateTime.now();
}
