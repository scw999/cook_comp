package com.gourmetwars.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Player {
    private String id;
    private String name;
    private int fame;
    private int totalScore;
    private List<Integer> roundScores = new ArrayList<>();

    public Player(String id, String name) {
        this.id = id;
        this.name = name;
        this.fame = 0;
        this.totalScore = 0;
        this.roundScores = new ArrayList<>();
    }

    public void addRoundScore(int score) {
        this.roundScores.add(score);
        this.totalScore += score;
        this.fame += score / 2;
    }

    public String getTier() {
        if (fame >= 450) return "로열 마스터";
        if (fame >= 300) return "마스터";
        if (fame >= 180) return "장인";
        if (fame >= 80) return "챌린저";
        return "언더독";
    }

    public String getTierClass() {
        if (fame >= 450) return "tier-royal";
        if (fame >= 300) return "tier-master";
        if (fame >= 180) return "tier-artisan";
        if (fame >= 80) return "tier-challenger";
        return "tier-underdog";
    }
}
