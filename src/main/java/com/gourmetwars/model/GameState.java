package com.gourmetwars.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameState {
    private String gameId;
    private List<Player> players = new ArrayList<>();
    private int currentPlayerIndex = 0;
    private int currentRound = 1;
    private int totalRounds = 4;
    private int phase = 1; // 1: 재료선택, 2: 조리, 3: 플레이팅

    // 현재 턴 상태
    private Ingredient mainIngredient;
    private Ingredient subIngredient1;
    private Ingredient subIngredient2;
    private int cookingScore = 0;
    private String selectedThemeId;
    private List<String> decorations = new ArrayList<>();

    // 보스전 상태
    private Boss currentBoss;
    private boolean bossActive = false;
    private List<String> defeatedBosses = new ArrayList<>();

    public Player getCurrentPlayer() {
        if (players.isEmpty()) return null;
        return players.get(currentPlayerIndex);
    }

    public boolean isGameOver() {
        return currentRound > totalRounds;
    }

    public void nextPlayer() {
        currentPlayerIndex++;
        if (currentPlayerIndex >= players.size()) {
            currentPlayerIndex = 0;
            currentRound++;
        }
    }

    public void resetTurnState() {
        mainIngredient = null;
        subIngredient1 = null;
        subIngredient2 = null;
        cookingScore = 0;
        selectedThemeId = null;
        decorations = new ArrayList<>();
        phase = 1;
    }
}
