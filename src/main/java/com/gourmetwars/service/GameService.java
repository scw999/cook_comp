package com.gourmetwars.service;

import com.gourmetwars.model.*;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {

    private final Map<String, GameState> games = new ConcurrentHashMap<>();
    private Map<String, List<Ingredient>> ingredients = new LinkedHashMap<>();
    private List<SynergyRule> synergyRules = new ArrayList<>();
    private List<Boss> bosses = new ArrayList<>();
    private List<Theme> themes = new ArrayList<>();
    private List<String> decorations = new ArrayList<>();

    @PostConstruct
    public void init() {
        initializeIngredients();
        initializeSynergyRules();
        initializeBosses();
        initializeThemes();
        initializeDecorations();
    }

    // ==================== 게임 생성 및 관리 ====================

    public GameState createGame(List<String> playerNames) {
        String gameId = UUID.randomUUID().toString().substring(0, 8);
        GameState game = new GameState();
        game.setGameId(gameId);

        for (int i = 0; i < playerNames.size(); i++) {
            Player player = new Player(
                "player-" + (i + 1),
                playerNames.get(i).isEmpty() ? "플레이어 " + (i + 1) : playerNames.get(i)
            );
            game.getPlayers().add(player);
        }

        games.put(gameId, game);
        return game;
    }

    public GameState getGame(String gameId) {
        return games.get(gameId);
    }

    // ==================== 재료 선택 ====================

    public Map<String, Object> selectIngredients(String gameId, String mainId, String sub1Id, String sub2Id) {
        GameState game = games.get(gameId);
        if (game == null) return null;

        Ingredient main = findIngredient(mainId);
        Ingredient sub1 = findIngredient(sub1Id);
        Ingredient sub2 = findIngredient(sub2Id);

        game.setMainIngredient(main);
        game.setSubIngredient1(sub1);
        game.setSubIngredient2(sub2);
        game.setPhase(2);

        Map<String, Object> result = new HashMap<>();
        result.put("synergy", calculateSynergy(mainId, sub1Id, sub2Id));
        result.put("synergyMessages", getSynergyMessages(mainId, sub1Id, sub2Id));
        result.put("game", game);

        return result;
    }

    private Ingredient findIngredient(String id) {
        for (List<Ingredient> list : ingredients.values()) {
            for (Ingredient ing : list) {
                if (ing.getId().equals(id)) {
                    return ing;
                }
            }
        }
        return null;
    }

    public int calculateSynergy(String... ingredientIds) {
        List<String> ids = Arrays.asList(ingredientIds);
        int totalSynergy = 50; // 기본값

        for (SynergyRule rule : synergyRules) {
            if (ids.containsAll(rule.getIngredients())) {
                totalSynergy += rule.getBonus();
            }
        }

        return Math.max(0, Math.min(100, totalSynergy));
    }

    public List<String> getSynergyMessages(String... ingredientIds) {
        List<String> ids = Arrays.asList(ingredientIds);
        List<String> messages = new ArrayList<>();

        for (SynergyRule rule : synergyRules) {
            if (ids.containsAll(rule.getIngredients())) {
                messages.add(rule.getMessage());
            }
        }

        return messages;
    }

    // ==================== 조리 점수 ====================

    public GameState setCookingScore(String gameId, int score) {
        GameState game = games.get(gameId);
        if (game == null) return null;

        game.setCookingScore(Math.min(100, score));
        game.setPhase(3);

        return game;
    }

    // ==================== 플레이팅 및 점수 계산 ====================

    public Map<String, Object> completePlating(String gameId, String themeId, List<String> decorations) {
        GameState game = games.get(gameId);
        if (game == null) return null;

        game.setSelectedThemeId(themeId);
        game.setDecorations(decorations);

        return calculateFinalScore(game);
    }

    public Map<String, Object> calculateFinalScore(GameState game) {
        int synergy = calculateSynergy(
            game.getMainIngredient().getId(),
            game.getSubIngredient1().getId(),
            game.getSubIngredient2().getId()
        );
        int cookingScore = game.getCookingScore();
        int platingHarmony = Math.min(100, 50 + game.getDecorations().size() * 10);

        // 테마 일치도 계산
        int themeMatch = 50;
        if (game.getSelectedThemeId() != null) {
            Theme theme = themes.stream()
                .filter(t -> t.getId().equals(game.getSelectedThemeId()))
                .findFirst()
                .orElse(null);

            if (theme != null) {
                List<String> selectedIds = Arrays.asList(
                    game.getMainIngredient().getId(),
                    game.getSubIngredient1().getId(),
                    game.getSubIngredient2().getId()
                );

                int matches = (int) selectedIds.stream()
                    .filter(id -> theme.getMatchIngredients().contains(id))
                    .count();

                themeMatch = 50 + matches * 15;
            }
        }

        // 심사위원 A (냉철한 분석가)
        int judgeAScore = (int) Math.round(
            (cookingScore * 0.5) + (synergy * 0.3) + (cookingScore * 0.2)
        );

        // 심사위원 B (감성 미식가)
        int judgeBScore = (int) Math.round(
            (platingHarmony * 0.4) + (themeMatch * 0.4) + (synergy * 0.2)
        );

        int totalScore = judgeAScore + judgeBScore;

        // 보스전 처리
        Integer bossScore = null;
        boolean bossDefeated = false;
        if (game.isBossActive() && game.getCurrentBoss() != null) {
            bossScore = 120 + new Random().nextInt(30);
            bossDefeated = totalScore > bossScore;
            if (bossDefeated) {
                game.getDefeatedBosses().add(game.getCurrentBoss().getId());
            }
            game.setBossActive(false);
            game.setCurrentBoss(null);
        }

        // 점수 저장
        Player currentPlayer = game.getCurrentPlayer();
        currentPlayer.addRoundScore(totalScore);

        Map<String, Object> result = new HashMap<>();
        result.put("judgeAScore", judgeAScore);
        result.put("judgeBScore", judgeBScore);
        result.put("totalScore", totalScore);
        result.put("synergy", synergy);
        result.put("cookingScore", cookingScore);
        result.put("platingHarmony", platingHarmony);
        result.put("themeMatch", themeMatch);
        result.put("bossScore", bossScore);
        result.put("bossDefeated", bossDefeated);
        result.put("player", currentPlayer);

        // 점수 세부 내역
        Map<String, Integer> judgeABreakdown = new HashMap<>();
        judgeABreakdown.put("cooking", (int) Math.round(cookingScore * 0.5));
        judgeABreakdown.put("synergy", (int) Math.round(synergy * 0.3));
        judgeABreakdown.put("handling", (int) Math.round(cookingScore * 0.2));
        result.put("judgeABreakdown", judgeABreakdown);

        Map<String, Integer> judgeBBreakdown = new HashMap<>();
        judgeBBreakdown.put("plating", (int) Math.round(platingHarmony * 0.4));
        judgeBBreakdown.put("theme", (int) Math.round(themeMatch * 0.4));
        judgeBBreakdown.put("synergy", (int) Math.round(synergy * 0.2));
        result.put("judgeBBreakdown", judgeBBreakdown);

        return result;
    }

    // ==================== 다음 턴 ====================

    public Map<String, Object> nextTurn(String gameId) {
        GameState game = games.get(gameId);
        if (game == null) return null;

        game.nextPlayer();
        game.resetTurnState();

        Map<String, Object> result = new HashMap<>();
        result.put("game", game);
        result.put("roundOver", game.getCurrentPlayerIndex() == 0);
        result.put("gameOver", game.isGameOver());

        // 보스전 체크
        if (!game.isGameOver()) {
            Player currentPlayer = game.getCurrentPlayer();
            Boss nextBoss = checkForBoss(currentPlayer, game.getDefeatedBosses());
            if (nextBoss != null) {
                game.setCurrentBoss(nextBoss);
                game.setBossActive(true);
                result.put("boss", nextBoss);
            }
        }

        return result;
    }

    private Boss checkForBoss(Player player, List<String> defeatedBosses) {
        for (Boss boss : bosses) {
            if (player.getFame() >= boss.getFameRequired() && !defeatedBosses.contains(boss.getId())) {
                return boss;
            }
        }
        return null;
    }

    // ==================== 게임 결과 ====================

    public Map<String, Object> getGameResults(String gameId) {
        GameState game = games.get(gameId);
        if (game == null) return null;

        List<Player> sortedPlayers = new ArrayList<>(game.getPlayers());
        sortedPlayers.sort((a, b) -> b.getTotalScore() - a.getTotalScore());

        Map<String, Object> result = new HashMap<>();
        result.put("players", sortedPlayers);
        result.put("winner", sortedPlayers.get(0));

        return result;
    }

    // ==================== 데이터 접근 ====================

    public Map<String, List<Ingredient>> getAllIngredients() {
        return ingredients;
    }

    public List<Theme> getAllThemes() {
        return themes;
    }

    public List<String> getAllDecorations() {
        return decorations;
    }

    public List<Boss> getAllBosses() {
        return bosses;
    }

    public Map<String, String> getCategoryNames() {
        Map<String, String> names = new LinkedHashMap<>();
        names.put("meat", "육류");
        names.put("seafood", "해산물");
        names.put("vegetable", "채소");
        names.put("dairy", "유제품");
        names.put("fruit", "과일");
        names.put("condiment", "양념/소스");
        names.put("fermented", "발효");
        names.put("grain", "곡물");
        names.put("spice", "향신료");
        names.put("nuts", "견과류");
        return names;
    }

    // ==================== 데이터 초기화 ====================

    private void initializeIngredients() {
        // 육류
        ingredients.put("meat", Arrays.asList(
            new Ingredient("pork", "돼지고기", "🥩", 75, "고소함", "meat"),
            new Ingredient("beef", "소고기", "🥓", 85, "풍미", "meat"),
            new Ingredient("chicken", "닭고기", "🍗", 70, "담백함", "meat"),
            new Ingredient("duck", "오리고기", "🦆", 80, "풍미", "meat"),
            new Ingredient("lamb", "양고기", "🐑", 78, "진함", "meat"),
            new Ingredient("bacon", "베이컨", "🥓", 82, "짭짤함", "meat"),
            new Ingredient("sausage", "소시지", "🌭", 70, "고소함", "meat"),
            new Ingredient("ham", "햄", "🍖", 68, "담백함", "meat")
        ));

        // 해산물
        ingredients.put("seafood", Arrays.asList(
            new Ingredient("shrimp", "새우", "🦐", 75, "달콤함", "seafood"),
            new Ingredient("oyster", "굴", "🦪", 80, "바다향", "seafood"),
            new Ingredient("salmon", "연어", "🍣", 85, "풍미", "seafood"),
            new Ingredient("squid", "오징어", "🦑", 70, "쫄깃함", "seafood"),
            new Ingredient("crab", "게", "🦀", 90, "달콤함", "seafood"),
            new Ingredient("eel", "장어", "🐟", 80, "고소함", "seafood"),
            new Ingredient("tuna", "참치", "🐟", 88, "담백함", "seafood"),
            new Ingredient("octopus", "문어", "🐙", 75, "쫄깃함", "seafood"),
            new Ingredient("clam", "조개", "🐚", 72, "바다향", "seafood"),
            new Ingredient("lobster", "랍스터", "🦞", 95, "달콤함", "seafood"),
            new Ingredient("scallop", "가리비", "🐚", 85, "부드러움", "seafood"),
            new Ingredient("mackerel", "고등어", "🐟", 75, "고소함", "seafood")
        ));

        // 채소
        ingredients.put("vegetable", Arrays.asList(
            new Ingredient("tomato", "토마토", "🍅", 65, "산뜻함", "vegetable"),
            new Ingredient("spinach", "시금치", "🥬", 50, "담백함", "vegetable"),
            new Ingredient("potato", "감자", "🥔", 55, "포근함", "vegetable"),
            new Ingredient("cucumber", "오이", "🥒", 45, "청량함", "vegetable"),
            new Ingredient("radish", "무", "🥕", 50, "아삭함", "vegetable"),
            new Ingredient("greenonion", "파", "🧅", 40, "향긋함", "vegetable"),
            new Ingredient("seaweed", "미역", "🌿", 55, "바다향", "vegetable"),
            new Ingredient("garlic", "마늘", "🧄", 60, "알싸함", "vegetable"),
            new Ingredient("onion", "양파", "🧅", 55, "달콤함", "vegetable"),
            new Ingredient("carrot", "당근", "🥕", 50, "달콤함", "vegetable"),
            new Ingredient("mushroom", "버섯", "🍄", 65, "감칠맛", "vegetable"),
            new Ingredient("cabbage", "양배추", "🥬", 45, "아삭함", "vegetable"),
            new Ingredient("broccoli", "브로콜리", "🥦", 55, "담백함", "vegetable"),
            new Ingredient("pepper", "피망", "🫑", 50, "아삭함", "vegetable"),
            new Ingredient("corn", "옥수수", "🌽", 60, "달콤함", "vegetable"),
            new Ingredient("eggplant", "가지", "🍆", 55, "부드러움", "vegetable"),
            new Ingredient("zucchini", "애호박", "🥒", 50, "담백함", "vegetable"),
            new Ingredient("asparagus", "아스파라거스", "🌿", 60, "고소함", "vegetable")
        ));

        // 유제품
        ingredients.put("dairy", Arrays.asList(
            new Ingredient("cheese", "치즈", "🧀", 75, "크리미", "dairy"),
            new Ingredient("butter", "버터", "🧈", 70, "고소함", "dairy"),
            new Ingredient("cream", "크림", "🥛", 65, "부드러움", "dairy"),
            new Ingredient("milk", "우유", "🥛", 55, "고소함", "dairy"),
            new Ingredient("yogurt", "요거트", "🥛", 60, "상큼함", "dairy"),
            new Ingredient("mozzarella", "모짜렐라", "🧀", 78, "쫄깃함", "dairy"),
            new Ingredient("parmesan", "파마산", "🧀", 85, "감칠맛", "dairy"),
            new Ingredient("ricotta", "리코타", "🧀", 68, "담백함", "dairy")
        ));

        // 과일
        ingredients.put("fruit", Arrays.asList(
            new Ingredient("lemon", "레몬", "🍋", 60, "상큼함", "fruit"),
            new Ingredient("pear", "배", "🍐", 70, "달콤함", "fruit"),
            new Ingredient("peach", "복숭아", "🍑", 75, "달콤함", "fruit"),
            new Ingredient("apple", "사과", "🍎", 70, "상큼함", "fruit"),
            new Ingredient("orange", "오렌지", "🍊", 68, "상큼함", "fruit"),
            new Ingredient("grape", "포도", "🍇", 72, "달콤함", "fruit"),
            new Ingredient("mango", "망고", "🥭", 80, "달콤함", "fruit"),
            new Ingredient("pineapple", "파인애플", "🍍", 75, "새콤함", "fruit"),
            new Ingredient("strawberry", "딸기", "🍓", 78, "상큼함", "fruit"),
            new Ingredient("cherry", "체리", "🍒", 72, "달콤함", "fruit"),
            new Ingredient("lime", "라임", "🍋", 58, "상큼함", "fruit"),
            new Ingredient("avocado", "아보카도", "🥑", 70, "고소함", "fruit")
        ));

        // 양념/소스
        ingredients.put("condiment", Arrays.asList(
            new Ingredient("shrimpPaste", "새우젓", "🫙", 85, "감칠맛", "condiment"),
            new Ingredient("soySauce", "간장", "🍶", 80, "감칠맛", "condiment"),
            new Ingredient("oliveoil", "올리브유", "🫒", 65, "고소함", "condiment"),
            new Ingredient("basil", "바질", "🌱", 60, "향긋함", "condiment"),
            new Ingredient("tofu", "두부", "🧊", 45, "담백함", "condiment"),
            new Ingredient("sesameOil", "참기름", "🫙", 75, "고소함", "condiment"),
            new Ingredient("vinegar", "식초", "🍶", 55, "새콤함", "condiment"),
            new Ingredient("honey", "꿀", "🍯", 80, "달콤함", "condiment"),
            new Ingredient("mustard", "머스타드", "🫙", 60, "알싸함", "condiment"),
            new Ingredient("wasabi", "와사비", "🟢", 70, "알싸함", "condiment"),
            new Ingredient("mayo", "마요네즈", "🫙", 65, "고소함", "condiment"),
            new Ingredient("ketchup", "케첩", "🍅", 60, "달콤함", "condiment"),
            new Ingredient("oysterSauce", "굴소스", "🫙", 78, "감칠맛", "condiment"),
            new Ingredient("fishSauce", "액젓", "🫙", 82, "감칠맛", "condiment")
        ));

        // 발효
        ingredients.put("fermented", Arrays.asList(
            new Ingredient("kimchi", "김치", "🥗", 80, "발효", "fermented"),
            new Ingredient("miso", "된장", "🥣", 85, "발효", "fermented"),
            new Ingredient("gochujang", "고추장", "🌶️", 80, "매콤함", "fermented"),
            new Ingredient("cheonggukjang", "청국장", "🥣", 88, "발효", "fermented"),
            new Ingredient("jeotgal", "젓갈", "🫙", 85, "감칠맛", "fermented"),
            new Ingredient("makgeolli", "막걸리", "🍶", 70, "달콤함", "fermented"),
            new Ingredient("vinegar_fermented", "발효식초", "🍶", 65, "새콤함", "fermented"),
            new Ingredient("natto", "낫토", "🫘", 75, "발효", "fermented")
        ));

        // 곡물
        ingredients.put("grain", Arrays.asList(
            new Ingredient("rice", "쌀", "🍚", 60, "담백함", "grain"),
            new Ingredient("noodle", "면", "🍜", 55, "쫄깃함", "grain"),
            new Ingredient("bread", "빵", "🍞", 58, "고소함", "grain"),
            new Ingredient("pasta", "파스타", "🍝", 60, "쫄깃함", "grain"),
            new Ingredient("flour", "밀가루", "🌾", 45, "담백함", "grain"),
            new Ingredient("oat", "귀리", "🌾", 55, "고소함", "grain"),
            new Ingredient("barley", "보리", "🌾", 52, "구수함", "grain"),
            new Ingredient("quinoa", "퀴노아", "🌾", 58, "담백함", "grain")
        ));

        // 향신료
        ingredients.put("spice", Arrays.asList(
            new Ingredient("salt", "소금", "🧂", 50, "짭짤함", "spice"),
            new Ingredient("blackPepper", "후추", "⚫", 55, "알싸함", "spice"),
            new Ingredient("chili", "고춧가루", "🌶️", 65, "매콤함", "spice"),
            new Ingredient("curry", "카레", "🟡", 75, "향긋함", "spice"),
            new Ingredient("cinnamon", "시나몬", "🟤", 60, "달콤함", "spice"),
            new Ingredient("ginger", "생강", "🫚", 65, "알싸함", "spice"),
            new Ingredient("turmeric", "강황", "🟡", 55, "향긋함", "spice"),
            new Ingredient("paprika", "파프리카가루", "🔴", 58, "달콤함", "spice"),
            new Ingredient("rosemary", "로즈마리", "🌿", 62, "향긋함", "spice"),
            new Ingredient("thyme", "타임", "🌿", 58, "향긋함", "spice"),
            new Ingredient("oregano", "오레가노", "🌿", 55, "향긋함", "spice"),
            new Ingredient("cumin", "큐민", "🟤", 60, "향긋함", "spice")
        ));

        // 견과류
        ingredients.put("nuts", Arrays.asList(
            new Ingredient("almond", "아몬드", "🥜", 70, "고소함", "nuts"),
            new Ingredient("walnut", "호두", "🥜", 72, "고소함", "nuts"),
            new Ingredient("peanut", "땅콩", "🥜", 68, "고소함", "nuts"),
            new Ingredient("cashew", "캐슈넛", "🥜", 74, "달콤함", "nuts"),
            new Ingredient("pistachio", "피스타치오", "🟢", 75, "고소함", "nuts"),
            new Ingredient("pine_nut", "잣", "🥜", 80, "고소함", "nuts"),
            new Ingredient("chestnut", "밤", "🌰", 72, "달콤함", "nuts"),
            new Ingredient("sesame", "깨", "⚪", 70, "고소함", "nuts")
        ));
    }

    private void initializeSynergyRules() {
        // 긍정 시너지
        synergyRules.add(new SynergyRule(Arrays.asList("pork", "shrimpPaste"), 20, "프로테아제가 소화를 돕고 감칠맛 증폭!"));
        synergyRules.add(new SynergyRule(Arrays.asList("tomato", "basil", "oliveoil"), 25, "지용성 비타민 흡수와 향미의 균형!"));
        synergyRules.add(new SynergyRule(Arrays.asList("tomato", "basil"), 15, "클래식한 이탈리안 조합!"));
        synergyRules.add(new SynergyRule(Arrays.asList("tomato", "oliveoil"), 10, "지용성 비타민 흡수 증가!"));
        synergyRules.add(new SynergyRule(Arrays.asList("beef", "pear"), 15, "배의 연육 효소가 고기를 부드럽게!"));
        synergyRules.add(new SynergyRule(Arrays.asList("oyster", "lemon"), 20, "비타민 C가 철분 흡수를 돕고 비린내 제거!"));
        synergyRules.add(new SynergyRule(Arrays.asList("potato", "cheese"), 15, "비타민과 단백질, 칼슘의 완벽한 조화!"));
        synergyRules.add(new SynergyRule(Arrays.asList("chicken", "lemon"), 10, "상큼한 레몬이 닭고기의 풍미를 살림!"));
        synergyRules.add(new SynergyRule(Arrays.asList("salmon", "cream"), 15, "크리미한 소스와 연어의 환상 조합!"));
        synergyRules.add(new SynergyRule(Arrays.asList("shrimp", "butter"), 12, "버터 쉬림프의 고소한 맛!"));
        synergyRules.add(new SynergyRule(Arrays.asList("beef", "soySauce"), 10, "간장이 소고기의 감칠맛을 증폭!"));
        synergyRules.add(new SynergyRule(Arrays.asList("pork", "kimchi"), 18, "김치찌개의 깊은 맛!"));
        synergyRules.add(new SynergyRule(Arrays.asList("tofu", "miso"), 12, "일본 전통의 맛!"));
        synergyRules.add(new SynergyRule(Arrays.asList("crab", "butter"), 15, "버터 크랩의 진한 풍미!"));
        synergyRules.add(new SynergyRule(Arrays.asList("lamb", "rosemary"), 18, "로즈마리가 양고기의 누린내를 잡아줌!"));
        synergyRules.add(new SynergyRule(Arrays.asList("duck", "orange"), 16, "오렌지 덕의 클래식한 조합!"));
        synergyRules.add(new SynergyRule(Arrays.asList("tuna", "avocado"), 14, "참치와 아보카도의 부드러운 조화!"));
        synergyRules.add(new SynergyRule(Arrays.asList("lobster", "butter"), 20, "버터 랍스터의 럭셔리한 풍미!"));
        synergyRules.add(new SynergyRule(Arrays.asList("pasta", "parmesan"), 15, "파스타의 정석 조합!"));
        synergyRules.add(new SynergyRule(Arrays.asList("rice", "sesameOil"), 12, "참기름 향이 밥맛을 살림!"));
        synergyRules.add(new SynergyRule(Arrays.asList("mushroom", "cream"), 14, "크림 버섯의 깊은 맛!"));
        synergyRules.add(new SynergyRule(Arrays.asList("bacon", "cheese"), 13, "베이컨 치즈의 고소함!"));
        synergyRules.add(new SynergyRule(Arrays.asList("mango", "shrimp"), 15, "망고 새우의 달콤한 조합!"));
        synergyRules.add(new SynergyRule(Arrays.asList("garlic", "butter"), 16, "갈릭 버터의 황금 조합!"));
        synergyRules.add(new SynergyRule(Arrays.asList("honey", "ginger"), 12, "생강과 꿀의 건강한 시너지!"));
        synergyRules.add(new SynergyRule(Arrays.asList("almond", "honey"), 10, "아몬드와 꿀의 달콤한 조화!"));
        synergyRules.add(new SynergyRule(Arrays.asList("pine_nut", "basil"), 14, "제노베제의 핵심 재료!"));
        synergyRules.add(new SynergyRule(Arrays.asList("scallop", "butter"), 18, "버터 가리비의 고급스러운 맛!"));
        synergyRules.add(new SynergyRule(Arrays.asList("curry", "rice"), 15, "카레라이스의 완벽한 조합!"));
        synergyRules.add(new SynergyRule(Arrays.asList("gochujang", "pork"), 16, "제육볶음의 매콤한 맛!"));

        // 부정 시너지
        synergyRules.add(new SynergyRule(Arrays.asList("seaweed", "greenonion"), -15, "파가 미역의 칼슘 흡수를 방해!"));
        synergyRules.add(new SynergyRule(Arrays.asList("spinach", "tofu"), -20, "시금치의 옥살산이 두부의 칼슘과 결합!"));
        synergyRules.add(new SynergyRule(Arrays.asList("cucumber", "radish"), -10, "오이의 효소가 무의 비타민 C를 파괴!"));
        synergyRules.add(new SynergyRule(Arrays.asList("eel", "peach"), -25, "복숭아의 유기산이 장어의 소화를 방해!"));
        synergyRules.add(new SynergyRule(Arrays.asList("milk", "lemon"), -15, "우유와 레몬이 응고됨!"));
        synergyRules.add(new SynergyRule(Arrays.asList("honey", "garlic"), -10, "꿀과 마늘의 어색한 조합!"));
    }

    private void initializeBosses() {
        bosses.add(new Boss("kangchulsoo", "강철수", "발효의 마스터, 종갓집 장손", "👴",
            "정통 한식을 고수하며 장류와 발효 음식을 주무기로 사용합니다.",
            "간섭", "플레이어가 선택한 재료 중 하나를 강제로 하급 재료로 교체합니다.",
            "downgrade", 80));

        bosses.add(new Boss("edwardlian", "에드워드 리안", "분자 요리의 연금술사", "🧑‍🔬",
            "요리를 과학으로 접근하며 분자 요리 기법을 사용합니다.",
            "복잡성", "조리 공정 난이도를 대폭 상승시키고 미니 게임 속도를 1.5배 빠르게 만듭니다.",
            "difficulty", 180));

        bosses.add(new Boss("chefchen", "마왕 첸", "화염의 지배자", "👨‍🍳",
            "중식을 기반으로 화력을 자유자재로 다루며 속도와 화려함을 중시합니다.",
            "시간 압박", "플레이어의 전체 조리 시간을 30% 단축시킵니다.",
            "time", 300));
    }

    private void initializeThemes() {
        themes.add(new Theme("memory", "추억", "📸", Arrays.asList("kimchi", "miso", "pork", "beef", "rice", "gochujang")));
        themes.add(new Theme("challenge", "도전", "🔥", Arrays.asList("gochujang", "eel", "crab", "lobster", "chili", "wasabi")));
        themes.add(new Theme("sea", "바다", "🌊", Arrays.asList("oyster", "salmon", "seaweed", "shrimp", "crab", "squid", "tuna", "lobster", "scallop")));
        themes.add(new Theme("garden", "정원", "🌸", Arrays.asList("tomato", "basil", "spinach", "cucumber", "broccoli", "asparagus")));
        themes.add(new Theme("comfort", "따뜻함", "🏠", Arrays.asList("potato", "cheese", "butter", "cream", "rice", "bread")));
        themes.add(new Theme("elegance", "우아함", "✨", Arrays.asList("salmon", "oyster", "cream", "lemon", "lobster")));
        themes.add(new Theme("spicy", "열정", "🌶️", Arrays.asList("gochujang", "chili", "curry", "ginger", "wasabi", "kimchi")));
        themes.add(new Theme("sweet", "달콤함", "🍰", Arrays.asList("honey", "mango", "strawberry", "cream", "cherry")));
    }

    private void initializeDecorations() {
        decorations = Arrays.asList("🌿", "🌸", "🍃", "🌺", "💫", "✨", "🔥", "❄️", "🌙", "⭐", "🎨", "💎", "🌹", "🍀", "💐", "🎭");
    }
}
