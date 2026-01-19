// ==================== 게임 데이터 ====================

const SERVER_INGREDIENTS = {
    meat: [
        { id: 'pork', name: '돼지고기', icon: '🥩', taste: 75, attribute: '고소함', category: 'meat' },
        { id: 'beef', name: '소고기', icon: '🥓', taste: 85, attribute: '풍미', category: 'meat' },
        { id: 'chicken', name: '닭고기', icon: '🍗', taste: 70, attribute: '담백함', category: 'meat' },
        { id: 'duck', name: '오리고기', icon: '🦆', taste: 80, attribute: '풍미', category: 'meat' },
        { id: 'lamb', name: '양고기', icon: '🐑', taste: 78, attribute: '진함', category: 'meat' },
        { id: 'bacon', name: '베이컨', icon: '🥓', taste: 82, attribute: '짭짤함', category: 'meat' },
        { id: 'sausage', name: '소시지', icon: '🌭', taste: 70, attribute: '고소함', category: 'meat' },
        { id: 'ham', name: '햄', icon: '🍖', taste: 68, attribute: '담백함', category: 'meat' }
    ],
    seafood: [
        { id: 'shrimp', name: '새우', icon: '🦐', taste: 75, attribute: '달콤함', category: 'seafood' },
        { id: 'oyster', name: '굴', icon: '🦪', taste: 80, attribute: '바다향', category: 'seafood' },
        { id: 'salmon', name: '연어', icon: '🍣', taste: 85, attribute: '풍미', category: 'seafood' },
        { id: 'squid', name: '오징어', icon: '🦑', taste: 70, attribute: '쫄깃함', category: 'seafood' },
        { id: 'crab', name: '게', icon: '🦀', taste: 90, attribute: '달콤함', category: 'seafood' },
        { id: 'eel', name: '장어', icon: '🐟', taste: 80, attribute: '고소함', category: 'seafood' },
        { id: 'tuna', name: '참치', icon: '🐟', taste: 88, attribute: '담백함', category: 'seafood' },
        { id: 'octopus', name: '문어', icon: '🐙', taste: 75, attribute: '쫄깃함', category: 'seafood' },
        { id: 'clam', name: '조개', icon: '🐚', taste: 72, attribute: '바다향', category: 'seafood' },
        { id: 'lobster', name: '랍스터', icon: '🦞', taste: 95, attribute: '달콤함', category: 'seafood' },
        { id: 'scallop', name: '가리비', icon: '🐚', taste: 85, attribute: '부드러움', category: 'seafood' },
        { id: 'mackerel', name: '고등어', icon: '🐟', taste: 75, attribute: '고소함', category: 'seafood' }
    ],
    vegetable: [
        { id: 'tomato', name: '토마토', icon: '🍅', taste: 65, attribute: '산뜻함', category: 'vegetable' },
        { id: 'spinach', name: '시금치', icon: '🥬', taste: 50, attribute: '담백함', category: 'vegetable' },
        { id: 'potato', name: '감자', icon: '🥔', taste: 55, attribute: '포근함', category: 'vegetable' },
        { id: 'cucumber', name: '오이', icon: '🥒', taste: 45, attribute: '청량함', category: 'vegetable' },
        { id: 'radish', name: '무', icon: '🥕', taste: 50, attribute: '아삭함', category: 'vegetable' },
        { id: 'greenonion', name: '파', icon: '🧅', taste: 40, attribute: '향긋함', category: 'vegetable' },
        { id: 'seaweed', name: '미역', icon: '🌿', taste: 55, attribute: '바다향', category: 'vegetable' },
        { id: 'garlic', name: '마늘', icon: '🧄', taste: 60, attribute: '알싸함', category: 'vegetable' },
        { id: 'onion', name: '양파', icon: '🧅', taste: 55, attribute: '달콤함', category: 'vegetable' },
        { id: 'carrot', name: '당근', icon: '🥕', taste: 50, attribute: '달콤함', category: 'vegetable' },
        { id: 'mushroom', name: '버섯', icon: '🍄', taste: 65, attribute: '감칠맛', category: 'vegetable' },
        { id: 'cabbage', name: '양배추', icon: '🥬', taste: 45, attribute: '아삭함', category: 'vegetable' },
        { id: 'broccoli', name: '브로콜리', icon: '🥦', taste: 55, attribute: '담백함', category: 'vegetable' },
        { id: 'pepper', name: '피망', icon: '🫑', taste: 50, attribute: '아삭함', category: 'vegetable' },
        { id: 'corn', name: '옥수수', icon: '🌽', taste: 60, attribute: '달콤함', category: 'vegetable' },
        { id: 'eggplant', name: '가지', icon: '🍆', taste: 55, attribute: '부드러움', category: 'vegetable' },
        { id: 'zucchini', name: '애호박', icon: '🥒', taste: 50, attribute: '담백함', category: 'vegetable' },
        { id: 'asparagus', name: '아스파라거스', icon: '🌿', taste: 60, attribute: '고소함', category: 'vegetable' }
    ],
    dairy: [
        { id: 'cheese', name: '치즈', icon: '🧀', taste: 75, attribute: '크리미', category: 'dairy' },
        { id: 'butter', name: '버터', icon: '🧈', taste: 70, attribute: '고소함', category: 'dairy' },
        { id: 'cream', name: '크림', icon: '🥛', taste: 65, attribute: '부드러움', category: 'dairy' },
        { id: 'milk', name: '우유', icon: '🥛', taste: 55, attribute: '고소함', category: 'dairy' },
        { id: 'yogurt', name: '요거트', icon: '🥛', taste: 60, attribute: '상큼함', category: 'dairy' },
        { id: 'mozzarella', name: '모짜렐라', icon: '🧀', taste: 78, attribute: '쫄깃함', category: 'dairy' },
        { id: 'parmesan', name: '파마산', icon: '🧀', taste: 85, attribute: '감칠맛', category: 'dairy' },
        { id: 'ricotta', name: '리코타', icon: '🧀', taste: 68, attribute: '담백함', category: 'dairy' }
    ],
    fruit: [
        { id: 'lemon', name: '레몬', icon: '🍋', taste: 60, attribute: '상큼함', category: 'fruit' },
        { id: 'pear', name: '배', icon: '🍐', taste: 70, attribute: '달콤함', category: 'fruit' },
        { id: 'peach', name: '복숭아', icon: '🍑', taste: 75, attribute: '달콤함', category: 'fruit' },
        { id: 'apple', name: '사과', icon: '🍎', taste: 70, attribute: '상큼함', category: 'fruit' },
        { id: 'orange', name: '오렌지', icon: '🍊', taste: 68, attribute: '상큼함', category: 'fruit' },
        { id: 'grape', name: '포도', icon: '🍇', taste: 72, attribute: '달콤함', category: 'fruit' },
        { id: 'mango', name: '망고', icon: '🥭', taste: 80, attribute: '달콤함', category: 'fruit' },
        { id: 'pineapple', name: '파인애플', icon: '🍍', taste: 75, attribute: '새콤함', category: 'fruit' },
        { id: 'strawberry', name: '딸기', icon: '🍓', taste: 78, attribute: '상큼함', category: 'fruit' },
        { id: 'cherry', name: '체리', icon: '🍒', taste: 72, attribute: '달콤함', category: 'fruit' },
        { id: 'lime', name: '라임', icon: '🍋', taste: 58, attribute: '상큼함', category: 'fruit' },
        { id: 'avocado', name: '아보카도', icon: '🥑', taste: 70, attribute: '고소함', category: 'fruit' }
    ],
    condiment: [
        { id: 'shrimpPaste', name: '새우젓', icon: '🫙', taste: 85, attribute: '감칠맛', category: 'condiment' },
        { id: 'soySauce', name: '간장', icon: '🍶', taste: 80, attribute: '감칠맛', category: 'condiment' },
        { id: 'oliveoil', name: '올리브유', icon: '🫒', taste: 65, attribute: '고소함', category: 'condiment' },
        { id: 'basil', name: '바질', icon: '🌱', taste: 60, attribute: '향긋함', category: 'condiment' },
        { id: 'tofu', name: '두부', icon: '🧊', taste: 45, attribute: '담백함', category: 'condiment' },
        { id: 'sesameOil', name: '참기름', icon: '🫙', taste: 75, attribute: '고소함', category: 'condiment' },
        { id: 'vinegar', name: '식초', icon: '🍶', taste: 55, attribute: '새콤함', category: 'condiment' },
        { id: 'honey', name: '꿀', icon: '🍯', taste: 80, attribute: '달콤함', category: 'condiment' },
        { id: 'mustard', name: '머스타드', icon: '🫙', taste: 60, attribute: '알싸함', category: 'condiment' },
        { id: 'wasabi', name: '와사비', icon: '🟢', taste: 70, attribute: '알싸함', category: 'condiment' },
        { id: 'mayo', name: '마요네즈', icon: '🫙', taste: 65, attribute: '고소함', category: 'condiment' },
        { id: 'ketchup', name: '케첩', icon: '🍅', taste: 60, attribute: '달콤함', category: 'condiment' },
        { id: 'oysterSauce', name: '굴소스', icon: '🫙', taste: 78, attribute: '감칠맛', category: 'condiment' },
        { id: 'fishSauce', name: '액젓', icon: '🫙', taste: 82, attribute: '감칠맛', category: 'condiment' }
    ],
    fermented: [
        { id: 'kimchi', name: '김치', icon: '🥗', taste: 80, attribute: '발효', category: 'fermented' },
        { id: 'miso', name: '된장', icon: '🥣', taste: 85, attribute: '발효', category: 'fermented' },
        { id: 'gochujang', name: '고추장', icon: '🌶️', taste: 80, attribute: '매콤함', category: 'fermented' },
        { id: 'cheonggukjang', name: '청국장', icon: '🥣', taste: 88, attribute: '발효', category: 'fermented' },
        { id: 'jeotgal', name: '젓갈', icon: '🫙', taste: 85, attribute: '감칠맛', category: 'fermented' },
        { id: 'makgeolli', name: '막걸리', icon: '🍶', taste: 70, attribute: '달콤함', category: 'fermented' },
        { id: 'natto', name: '낫토', icon: '🫘', taste: 75, attribute: '발효', category: 'fermented' }
    ],
    grain: [
        { id: 'rice', name: '쌀', icon: '🍚', taste: 60, attribute: '담백함', category: 'grain' },
        { id: 'noodle', name: '면', icon: '🍜', taste: 55, attribute: '쫄깃함', category: 'grain' },
        { id: 'bread', name: '빵', icon: '🍞', taste: 58, attribute: '고소함', category: 'grain' },
        { id: 'pasta', name: '파스타', icon: '🍝', taste: 60, attribute: '쫄깃함', category: 'grain' },
        { id: 'flour', name: '밀가루', icon: '🌾', taste: 45, attribute: '담백함', category: 'grain' },
        { id: 'oat', name: '귀리', icon: '🌾', taste: 55, attribute: '고소함', category: 'grain' },
        { id: 'barley', name: '보리', icon: '🌾', taste: 52, attribute: '구수함', category: 'grain' },
        { id: 'quinoa', name: '퀴노아', icon: '🌾', taste: 58, attribute: '담백함', category: 'grain' }
    ],
    spice: [
        { id: 'salt', name: '소금', icon: '🧂', taste: 50, attribute: '짭짤함', category: 'spice' },
        { id: 'blackPepper', name: '후추', icon: '⚫', taste: 55, attribute: '알싸함', category: 'spice' },
        { id: 'chili', name: '고춧가루', icon: '🌶️', taste: 65, attribute: '매콤함', category: 'spice' },
        { id: 'curry', name: '카레', icon: '🟡', taste: 75, attribute: '향긋함', category: 'spice' },
        { id: 'cinnamon', name: '시나몬', icon: '🟤', taste: 60, attribute: '달콤함', category: 'spice' },
        { id: 'ginger', name: '생강', icon: '🫚', taste: 65, attribute: '알싸함', category: 'spice' },
        { id: 'turmeric', name: '강황', icon: '🟡', taste: 55, attribute: '향긋함', category: 'spice' },
        { id: 'paprika', name: '파프리카가루', icon: '🔴', taste: 58, attribute: '달콤함', category: 'spice' },
        { id: 'rosemary', name: '로즈마리', icon: '🌿', taste: 62, attribute: '향긋함', category: 'spice' },
        { id: 'thyme', name: '타임', icon: '🌿', taste: 58, attribute: '향긋함', category: 'spice' },
        { id: 'oregano', name: '오레가노', icon: '🌿', taste: 55, attribute: '향긋함', category: 'spice' },
        { id: 'cumin', name: '큐민', icon: '🟤', taste: 60, attribute: '향긋함', category: 'spice' }
    ],
    nuts: [
        { id: 'almond', name: '아몬드', icon: '🥜', taste: 70, attribute: '고소함', category: 'nuts' },
        { id: 'walnut', name: '호두', icon: '🥜', taste: 72, attribute: '고소함', category: 'nuts' },
        { id: 'peanut', name: '땅콩', icon: '🥜', taste: 68, attribute: '고소함', category: 'nuts' },
        { id: 'cashew', name: '캐슈넛', icon: '🥜', taste: 74, attribute: '달콤함', category: 'nuts' },
        { id: 'pistachio', name: '피스타치오', icon: '🟢', taste: 75, attribute: '고소함', category: 'nuts' },
        { id: 'pine_nut', name: '잣', icon: '🥜', taste: 80, attribute: '고소함', category: 'nuts' },
        { id: 'chestnut', name: '밤', icon: '🌰', taste: 72, attribute: '달콤함', category: 'nuts' },
        { id: 'sesame', name: '깨', icon: '⚪', taste: 70, attribute: '고소함', category: 'nuts' }
    ]
};

const SYNERGY_RULES = [
    // 긍정 시너지
    { ingredients: ['pork', 'shrimpPaste'], bonus: 20, message: '프로테아제가 소화를 돕고 감칠맛 증폭!' },
    { ingredients: ['tomato', 'basil', 'oliveoil'], bonus: 25, message: '지용성 비타민 흡수와 향미의 균형!' },
    { ingredients: ['tomato', 'basil'], bonus: 15, message: '클래식한 이탈리안 조합!' },
    { ingredients: ['tomato', 'oliveoil'], bonus: 10, message: '지용성 비타민 흡수 증가!' },
    { ingredients: ['beef', 'pear'], bonus: 15, message: '배의 연육 효소가 고기를 부드럽게!' },
    { ingredients: ['oyster', 'lemon'], bonus: 20, message: '비타민 C가 철분 흡수를 돕고 비린내 제거!' },
    { ingredients: ['potato', 'cheese'], bonus: 15, message: '비타민과 단백질, 칼슘의 완벽한 조화!' },
    { ingredients: ['chicken', 'lemon'], bonus: 10, message: '상큼한 레몬이 닭고기의 풍미를 살림!' },
    { ingredients: ['salmon', 'cream'], bonus: 15, message: '크리미한 소스와 연어의 환상 조합!' },
    { ingredients: ['shrimp', 'butter'], bonus: 12, message: '버터 쉬림프의 고소한 맛!' },
    { ingredients: ['beef', 'soySauce'], bonus: 10, message: '간장이 소고기의 감칠맛을 증폭!' },
    { ingredients: ['pork', 'kimchi'], bonus: 18, message: '김치찌개의 깊은 맛!' },
    { ingredients: ['tofu', 'miso'], bonus: 12, message: '일본 전통의 맛!' },
    { ingredients: ['crab', 'butter'], bonus: 15, message: '버터 크랩의 진한 풍미!' },
    { ingredients: ['lamb', 'rosemary'], bonus: 18, message: '로즈마리가 양고기의 누린내를 잡아줌!' },
    { ingredients: ['duck', 'orange'], bonus: 16, message: '오렌지 덕의 클래식한 조합!' },
    { ingredients: ['tuna', 'avocado'], bonus: 14, message: '참치와 아보카도의 부드러운 조화!' },
    { ingredients: ['lobster', 'butter'], bonus: 20, message: '버터 랍스터의 럭셔리한 풍미!' },
    { ingredients: ['pasta', 'parmesan'], bonus: 15, message: '파스타의 정석 조합!' },
    { ingredients: ['rice', 'sesameOil'], bonus: 12, message: '참기름 향이 밥맛을 살림!' },
    { ingredients: ['mushroom', 'cream'], bonus: 14, message: '크림 버섯의 깊은 맛!' },
    { ingredients: ['bacon', 'cheese'], bonus: 13, message: '베이컨 치즈의 고소함!' },
    { ingredients: ['mango', 'shrimp'], bonus: 15, message: '망고 새우의 달콤한 조합!' },
    { ingredients: ['garlic', 'butter'], bonus: 16, message: '갈릭 버터의 황금 조합!' },
    { ingredients: ['honey', 'ginger'], bonus: 12, message: '생강과 꿀의 건강한 시너지!' },
    { ingredients: ['almond', 'honey'], bonus: 10, message: '아몬드와 꿀의 달콤한 조화!' },
    { ingredients: ['pine_nut', 'basil'], bonus: 14, message: '제노베제의 핵심 재료!' },
    { ingredients: ['scallop', 'butter'], bonus: 18, message: '버터 가리비의 고급스러운 맛!' },
    { ingredients: ['curry', 'rice'], bonus: 15, message: '카레라이스의 완벽한 조합!' },
    { ingredients: ['gochujang', 'pork'], bonus: 16, message: '제육볶음의 매콤한 맛!' },
    // 부정 시너지
    { ingredients: ['seaweed', 'greenonion'], bonus: -15, message: '파가 미역의 칼슘 흡수를 방해!' },
    { ingredients: ['spinach', 'tofu'], bonus: -20, message: '시금치의 옥살산이 두부의 칼슘과 결합!' },
    { ingredients: ['cucumber', 'radish'], bonus: -10, message: '오이의 효소가 무의 비타민 C를 파괴!' },
    { ingredients: ['eel', 'peach'], bonus: -25, message: '복숭아의 유기산이 장어의 소화를 방해!' },
    { ingredients: ['milk', 'lemon'], bonus: -15, message: '우유와 레몬이 응고됨!' },
    { ingredients: ['honey', 'garlic'], bonus: -10, message: '꿀과 마늘의 어색한 조합!' }
];

const SERVER_BOSSES = [
    {
        id: 'kangchulsoo',
        name: '강철수',
        title: '발효의 마스터, 종갓집 장손',
        icon: '👴',
        description: '정통 한식을 고수하며 장류와 발효 음식을 주무기로 사용합니다.',
        skillName: '간섭',
        skillDesc: '플레이어가 선택한 재료 중 하나를 강제로 하급 재료로 교체합니다.',
        skillEffect: 'downgrade',
        fameRequired: 80
    },
    {
        id: 'edwardlian',
        name: '에드워드 리안',
        title: '분자 요리의 연금술사',
        icon: '🧑‍🔬',
        description: '요리를 과학으로 접근하며 분자 요리 기법을 사용합니다.',
        skillName: '복잡성',
        skillDesc: '조리 공정 난이도를 대폭 상승시키고 미니 게임 속도를 1.5배 빠르게 만듭니다.',
        skillEffect: 'difficulty',
        fameRequired: 180
    },
    {
        id: 'chefchen',
        name: '마왕 첸',
        title: '화염의 지배자',
        icon: '👨‍🍳',
        description: '중식을 기반으로 화력을 자유자재로 다루며 속도와 화려함을 중시합니다.',
        skillName: '시간 압박',
        skillDesc: '플레이어의 전체 조리 시간을 30% 단축시킵니다.',
        skillEffect: 'time',
        fameRequired: 300
    }
];

const SERVER_THEMES = [
    { id: 'memory', name: '추억', icon: '📸', matchIngredients: ['kimchi', 'miso', 'pork', 'beef', 'rice', 'gochujang'] },
    { id: 'challenge', name: '도전', icon: '🔥', matchIngredients: ['gochujang', 'eel', 'crab', 'lobster', 'chili', 'wasabi'] },
    { id: 'sea', name: '바다', icon: '🌊', matchIngredients: ['oyster', 'salmon', 'seaweed', 'shrimp', 'crab', 'squid', 'tuna', 'lobster', 'scallop'] },
    { id: 'garden', name: '정원', icon: '🌸', matchIngredients: ['tomato', 'basil', 'spinach', 'cucumber', 'broccoli', 'asparagus'] },
    { id: 'comfort', name: '따뜻함', icon: '🏠', matchIngredients: ['potato', 'cheese', 'butter', 'cream', 'rice', 'bread'] },
    { id: 'elegance', name: '우아함', icon: '✨', matchIngredients: ['salmon', 'oyster', 'cream', 'lemon', 'lobster'] },
    { id: 'spicy', name: '열정', icon: '🌶️', matchIngredients: ['gochujang', 'chili', 'curry', 'ginger', 'wasabi', 'kimchi'] },
    { id: 'sweet', name: '달콤함', icon: '🍰', matchIngredients: ['honey', 'mango', 'strawberry', 'cream', 'cherry'] }
];

const SERVER_DECORATIONS = ['🌿', '🌸', '🍃', '🌺', '💫', '✨', '🔥', '❄️', '🌙', '⭐', '🎨', '💎', '🌹', '🍀', '💐', '🎭'];

const COOKING_MINI_GAMES = [
    { id: 'timing', name: '타이밍 맞추기', icon: '🎯', desc: '정확한 타이밍에 터치하세요!' },
    { id: 'cutting', name: '썰기', icon: '🔪', desc: '재료를 정확하게 썰어주세요!' },
    { id: 'stirring', name: '휘젓기', icon: '🥄', desc: '빠르게 원을 그리며 저어주세요!' },
    { id: 'wok', name: '웍 볶기', icon: '🍳', desc: '웍을 흔들어 재료를 볶아주세요!' },
    { id: 'frying', name: '튀기기', icon: '🍟', desc: '적절한 온도에서 튀겨주세요!' },
    { id: 'grilling', name: '굽기', icon: '🥩', desc: '고기를 적절히 뒤집어주세요!' },
    { id: 'boiling', name: '끓이기', icon: '🫕', desc: '불 조절을 정확하게 하세요!' },
    { id: 'tapping', name: '손질하기', icon: '👋', desc: '빠르게 탭해서 손질하세요!' }
];

const JUDGE_COMMENTS = {
    A: {
        excellent: [
            "이 조리 실력은 정말 놀랍습니다!",
            "완벽에 가까운 테크닉이군요.",
            "프로페셔널한 솜씨입니다.",
            "기술적으로 흠잡을 데가 없네요.",
            "이 정도 실력이라면 어디서든 인정받겠군요."
        ],
        good: [
            "괜찮은 조리 실력입니다.",
            "안정적인 테크닉이네요.",
            "기본기가 탄탄합니다.",
            "좋은 시도였습니다.",
            "발전 가능성이 보입니다."
        ],
        average: [
            "조금 더 연습이 필요해 보입니다.",
            "기본적인 부분에서 아쉬움이 있네요.",
            "나쁘지 않지만 인상적이진 않습니다.",
            "평범한 수준입니다.",
            "개선의 여지가 있습니다."
        ],
        poor: [
            "많은 연습이 필요합니다.",
            "기초부터 다시 시작해보세요.",
            "조리 과정에서 실수가 많았습니다.",
            "아쉬운 결과네요.",
            "다음에는 더 잘할 수 있을 겁니다."
        ]
    },
    B: {
        excellent: [
            "눈이 즐거운 요리입니다!",
            "이 프레젠테이션은 예술이에요!",
            "감성적으로 완벽합니다.",
            "마음을 사로잡는 플레이팅이네요.",
            "이 요리에서 스토리가 느껴집니다."
        ],
        good: [
            "보기 좋은 요리네요.",
            "센스 있는 플레이팅입니다.",
            "좋은 인상을 주는 요리입니다.",
            "테마 선택이 적절했어요.",
            "감각적인 면이 있네요."
        ],
        average: [
            "무난한 플레이팅이에요.",
            "조금 더 창의성이 필요해요.",
            "평범한 프레젠테이션입니다.",
            "특별한 점을 찾기 어렵네요.",
            "기본에 충실한 모습입니다."
        ],
        poor: [
            "시각적 매력이 부족합니다.",
            "플레이팅에 신경을 더 쓰셔야 해요.",
            "테마가 명확하지 않네요.",
            "감성적인 부분이 아쉽습니다.",
            "다음엔 더 예쁘게 담아보세요."
        ]
    }
};
