package com.gourmetwars.controller;

import com.gourmetwars.model.*;
import com.gourmetwars.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
public class GameController {

    @Autowired
    private GameService gameService;

    // ==================== 페이지 렌더링 ====================

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("ingredients", gameService.getAllIngredients());
        model.addAttribute("categoryNames", gameService.getCategoryNames());
        model.addAttribute("themes", gameService.getAllThemes());
        model.addAttribute("decorations", gameService.getAllDecorations());
        model.addAttribute("bosses", gameService.getAllBosses());
        return "index";
    }

    // ==================== REST API ====================

    @PostMapping("/api/game/create")
    @ResponseBody
    public ResponseEntity<GameState> createGame(@RequestBody Map<String, List<String>> request) {
        List<String> playerNames = request.get("players");
        if (playerNames == null || playerNames.size() < 2 || playerNames.size() > 4) {
            return ResponseEntity.badRequest().build();
        }
        GameState game = gameService.createGame(playerNames);
        return ResponseEntity.ok(game);
    }

    @GetMapping("/api/game/{gameId}")
    @ResponseBody
    public ResponseEntity<GameState> getGame(@PathVariable String gameId) {
        GameState game = gameService.getGame(gameId);
        if (game == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(game);
    }

    @PostMapping("/api/game/{gameId}/ingredients")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> selectIngredients(
            @PathVariable String gameId,
            @RequestBody Map<String, String> request) {

        String mainId = request.get("main");
        String sub1Id = request.get("sub1");
        String sub2Id = request.get("sub2");

        if (mainId == null || sub1Id == null || sub2Id == null) {
            return ResponseEntity.badRequest().build();
        }

        Map<String, Object> result = gameService.selectIngredients(gameId, mainId, sub1Id, sub2Id);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/game/{gameId}/synergy")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> calculateSynergy(
            @PathVariable String gameId,
            @RequestBody Map<String, String> request) {

        String mainId = request.get("main");
        String sub1Id = request.get("sub1");
        String sub2Id = request.get("sub2");

        int synergy = gameService.calculateSynergy(mainId, sub1Id, sub2Id);
        List<String> messages = gameService.getSynergyMessages(mainId, sub1Id, sub2Id);

        return ResponseEntity.ok(Map.of(
            "synergy", synergy,
            "messages", messages
        ));
    }

    @PostMapping("/api/game/{gameId}/cooking")
    @ResponseBody
    public ResponseEntity<GameState> setCookingScore(
            @PathVariable String gameId,
            @RequestBody Map<String, Integer> request) {

        Integer score = request.get("score");
        if (score == null) {
            return ResponseEntity.badRequest().build();
        }

        GameState game = gameService.setCookingScore(gameId, score);
        if (game == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(game);
    }

    @PostMapping("/api/game/{gameId}/plating")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> completePlating(
            @PathVariable String gameId,
            @RequestBody Map<String, Object> request) {

        String themeId = (String) request.get("theme");
        @SuppressWarnings("unchecked")
        List<String> decorations = (List<String>) request.get("decorations");

        Map<String, Object> result = gameService.completePlating(gameId, themeId, decorations);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/game/{gameId}/next")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> nextTurn(@PathVariable String gameId) {
        Map<String, Object> result = gameService.nextTurn(gameId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/game/{gameId}/results")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getResults(@PathVariable String gameId) {
        Map<String, Object> result = gameService.getGameResults(gameId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    // ==================== 데이터 API ====================

    @GetMapping("/api/ingredients")
    @ResponseBody
    public ResponseEntity<Map<String, List<Ingredient>>> getAllIngredients() {
        return ResponseEntity.ok(gameService.getAllIngredients());
    }

    @GetMapping("/api/themes")
    @ResponseBody
    public ResponseEntity<List<Theme>> getAllThemes() {
        return ResponseEntity.ok(gameService.getAllThemes());
    }

    @GetMapping("/api/decorations")
    @ResponseBody
    public ResponseEntity<List<String>> getAllDecorations() {
        return ResponseEntity.ok(gameService.getAllDecorations());
    }

    @GetMapping("/api/bosses")
    @ResponseBody
    public ResponseEntity<List<Boss>> getAllBosses() {
        return ResponseEntity.ok(gameService.getAllBosses());
    }
}
