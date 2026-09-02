import type {
  AdminCardAttributesData,
  AdminCatalogData,
  AdminOverviewData,
  AdminSellerApprovalData,
} from "@/features/admin/admin.types";

const SPARK_BARS = [9, 14, 11, 18, 13, 22, 17, 26];

export const ADMIN_OVERVIEW_FIXTURE: AdminOverviewData = {
  title: "ภาพรวมแพลตฟอร์ม",
  subtitle:
    "สรุปผลประกอบการและกิจกรรมทั้งหมดบน Pegasus TCG · อัปเดตล่าสุด 5 นาทีที่แล้ว",

  stats: [
    {
      id: "gmv",
      label: "ยอดขายรวมเดือนนี้",
      value: "฿428,500",
      delta: "+18.2%",
      footnote: "เทียบกับ ฿362,400 เดือนก่อน",
      bars: SPARK_BARS,
      accent: "primary",
    },
    {
      id: "new-sellers",
      label: "ผู้ขายรายใหม่",
      value: "32",
      delta: "+9.4%",
      footnote: "ผ่านการยืนยัน KYC แล้ว",
      bars: SPARK_BARS,
      accent: "teal",
    },
    {
      id: "active-listings",
      label: "ประกาศขายที่ใช้งานอยู่",
      value: "6,184",
      delta: "+3.1%",
      footnote: "จาก 442 ร้านค้าทั่วแพลตฟอร์ม",
      bars: SPARK_BARS,
      accent: "primary",
    },
    {
      id: "commission",
      label: "ค่าคอมมิชชั่นที่เก็บได้",
      value: "฿12,850",
      delta: "+18.2%",
      footnote: "เฉลี่ย 3.0% ของยอดขายรวม",
      bars: SPARK_BARS,
      accent: "green",
    },
  ],

  monthlySales: {
    title: "ยอดขายรายเดือน",
    description: "แสดงยอดขายรวม 6 เดือนล่าสุด (บาท)",
    points: [
      { month: "ม.ค.", singles: 182000, sealed: 96000 },
      { month: "ก.พ.", singles: 168000, sealed: 104000 },
      { month: "มี.ค.", singles: 214000, sealed: 118000 },
      { month: "เม.ย.", singles: 236000, sealed: 132000 },
      { month: "พ.ค.", singles: 258000, sealed: 148000 },
      { month: "มิ.ย.", singles: 284000, sealed: 164000 },
    ],
  },

  activity: {
    title: "กิจกรรมล่าสุด",
    description: "เหตุการณ์สำคัญที่ต้องรับทราบ",
    actionLabel: "ดูกิจกรรมทั้งหมด",
    items: [
      {
        id: "act-1",
        initials: "MT",
        avatarAccent: "teal",
        name: "minmin_tcg",
        time: "· 5 นาที",
        message: "ส่งเอกสาร KYC เพื่อขอเปิดร้าน",
        status: "pending",
        statusLabel: "รอตรวจสอบ",
      },
      {
        id: "act-2",
        initials: "SY",
        avatarAccent: "red",
        name: "ระบบ",
        time: "· 22 นาที",
        message: "ตรวจพบประกาศขายราคาผิดปกติ 3 รายการ",
        status: "attention",
        statusLabel: "ต้องตรวจสอบ",
      },
      {
        id: "act-3",
        initials: "KP",
        avatarAccent: "primary",
        name: "kandypop",
        time: "· 1 ชม.",
        message: "ขอเพิ่มการ์ดใหม่เข้าแคตตาล็อก",
        status: "pending",
        statusLabel: "รออนุมัติ",
      },
      {
        id: "act-4",
        initials: "ST",
        avatarAccent: "primary",
        name: "sora.trades",
        time: "· 2 ชม.",
        message: "ร้องเรียนคำสั่งซื้อ ORD-10201",
        status: "attention",
        statusLabel: "เปิดเคสแล้ว",
      },
      {
        id: "act-5",
        initials: "PH",
        avatarAccent: "green",
        name: "pika.hunter",
        time: "· 4 ชม.",
        message: "ยืนยันตัวตนผ่านเรียบร้อย",
        status: "success",
        statusLabel: "สำเร็จ",
      },
    ],
  },

  topSellers: {
    title: "ร้านค้าที่ทำยอดขายสูงสุด",
    description: "จัดอันดับตามยอดขายเดือนสิงหาคม 2569",
    items: [
      { id: "s1", name: "minmin_tcg", amount: "฿86,400", percent: 100 },
      { id: "s2", name: "kandypop", amount: "฿62,180", percent: 72 },
      { id: "s3", name: "sora.trades", amount: "฿48,900", percent: 57 },
      { id: "s4", name: "pika.hunter", amount: "฿31,250", percent: 36 },
      { id: "s5", name: "tcg.bkk", amount: "฿24,700", percent: 29 },
    ],
  },

  gameShare: {
    title: "สัดส่วนยอดขายตามเกม",
    description: "ม.ค. - มิ.ย. 2569",
    slices: [
      { id: "pokemon", name: "Pokémon", value: 46 },
      { id: "one-piece", name: "One Piece", value: 22 },
      { id: "union-arena", name: "Union Arena", value: 14 },
      { id: "yugioh", name: "Yu-Gi-Oh!", value: 11 },
      { id: "others", name: "อื่น ๆ", value: 7 },
    ],
    footnoteTitle: "Pokémon ครองส่วนแบ่ง 46%",
    footnoteDescription: "ข้อมูลจากคำสั่งซื้อที่สำเร็จแล้ว",
  },
};

/**
 * ข้อมูลตัวอย่างของหน้า "จัดการแคตตาล็อก" — ข้อความและตัวเลขลอกจาก
 * Figma node 710:3989 เพื่อให้เทียบหน้าจอกับดีไซน์ได้ตรง ๆ
 * เมื่อต่อ API จริงแล้วให้แทนที่ทั้งก้อนนี้
 */
export const ADMIN_CATALOG_FIXTURE: AdminCatalogData = {
  title: "จัดการแคตตาล็อก",
  subtitle:
    "ฐานข้อมูลการ์ดกลางของแพลตฟอร์ม · ผู้ขายเลือกการ์ดจากที่นี่เพื่อลงขาย",

  games: {
    title: "เกมทั้งหมด",
    description: "5 เกมที่เปิดใช้งาน",
    activeId: "pokemon",
    items: [
      { id: "pokemon", name: "Pokémon", count: "8,420" },
      { id: "one-piece", name: "One Piece", count: "4,190" },
      { id: "mtg", name: "Magic: The Gathering", count: "3,510" },
      { id: "yugioh", name: "Yu-Gi-Oh!", count: "2,180" },
      { id: "sports", name: "Sports Cards", count: "640" },
    ],
  },

  sets: {
    title: "กรองตามชุด (Set)",
    items: [
      { id: "obsidian-flames", name: "Obsidian Flames", defaultChecked: true },
      { id: "paldea-evolved", name: "Paldea Evolved" },
      { id: "scarlet-violet", name: "Scarlet & Violet" },
      { id: "paradox-rift", name: "Paradox Rift" },
    ],
  },

  summary: {
    label: "การ์ดในแคตตาล็อก",
    value: "18,940",
    footnote: "เพิ่มขึ้น 1,180 ใบเดือนนี้",
  },

  toolbar: {
    resultLabel: "แสดง 8 จาก 8,420 ใบ",
    searchPlaceholder: "ค้นหาชื่อการ์ด, เลขในชุด...",
    selects: [
      {
        id: "rarity",
        placeholder: "ความหายาก: ทั้งหมด",
        options: [
          { value: "all", label: "ความหายาก: ทั้งหมด" },
          { value: "common", label: "Common" },
          { value: "rare", label: "Rare" },
          { value: "secret", label: "Secret Rare" },
        ],
      },
      {
        id: "sort",
        placeholder: "เรียงตาม: ยอดนิยม",
        options: [
          { value: "popular", label: "เรียงตาม: ยอดนิยม" },
          { value: "newest", label: "เรียงตาม: ใหม่ล่าสุด" },
          { value: "price-asc", label: "เรียงตาม: ราคาต่ำ-สูง" },
          { value: "price-desc", label: "เรียงตาม: ราคาสูง-ต่ำ" },
        ],
      },
      {
        id: "product-type",
        placeholder: "ชนิดของสินค้า: ทั้งหมด",
        options: [
          { value: "all", label: "ชนิดของสินค้า: ทั้งหมด" },
          { value: "single", label: "การ์ดเดี่ยว" },
          { value: "box", label: "กล่องสุ่ม" },
          { value: "pack", label: "ซองสุ่ม" },
        ],
      },
    ],
  },

  products: [
    {
      id: "charizard-ex",
      type: "การ์ดเดี่ยว",
      title: "Charizard ex — Obsidian Flames",
      price: "฿1,290",
    },
    {
      id: "pikachu-vmax",
      type: "การ์ดเดี่ยว",
      title: "Pikachu VMAX — Rainbow Rare",
      price: "฿2,450",
    },
    {
      id: "paldea-box",
      type: "กล่องสุ่ม",
      title: "Paldea Evolved Booster Box",
      price: "฿4,890",
    },
    {
      id: "mewtwo-v",
      type: "การ์ดเดี่ยว",
      title: "Mewtwo V — Alt Art",
      price: "฿980",
    },
    {
      id: "luffy-gear-5",
      type: "การ์ดเดี่ยว",
      title: "Luffy Gear 5 — Leader Parallel",
      price: "฿1,650",
    },
    {
      id: "sv-pack",
      type: "ซองสุ่ม",
      title: "Scarlet & Violet Booster Pack",
      price: "฿180",
    },
    {
      id: "gengar-vmax",
      type: "การ์ดเดี่ยว",
      title: "Gengar VMAX — Full Art",
      price: "฿1,120",
    },
    {
      id: "rookie-serial",
      type: "การ์ดเดี่ยว",
      title: "2024 Rookie Serial /99",
      price: "฿3,200",
    },
  ],

  pagination: {
    label: "หน้า 1 จาก 1,053",
    previousLabel: "ก่อนหน้า",
    nextLabel: "ถัดไป",
  },
};

export const ADMIN_CARD_ATTRIBUTES_FIXTURE: AdminCardAttributesData = {
  title: "คุณสมบัติการ์ด",
  subtitle:
    "กำหนดว่าการ์ดแต่ละเกมมีข้อมูลอะไรบ้าง — ใช้สร้างตัวกรองและฟอร์มลงขายอัตโนมัติ",

  actions: {
    viewJsonLabel: "ดูเป็น JSON",
    saveLabel: "บันทึก schema",
  },

  notice:
    'การแก้ไข schema จะมีผลกับฟอร์มลงขายของผู้ขายทันที — ฟิลด์ที่ตั้งเป็น "จำเป็น" จะบังคับกรอกในประกาศขายใหม่ทั้งหมด',

  gamePicker: { title: "เลือกเกม" },

  fieldTypes: {
    title: "ประเภทฟิลด์ที่รองรับ",
    items: [
      { type: "text", description: "ข้อความสั้น" },
      { type: "number", description: "ตัวเลข" },
      { type: "enum", description: "ตัวเลือก" },
      { type: "boolean", description: "ใช่/ไม่ใช่" },
    ],
  },

  table: {
    addFieldLabel: "+ เพิ่มฟิลด์",
    columns: {
      name: "ชื่อฟิลด์",
      type: "ประเภท",
      sample: "ค่าตัวอย่าง",
      required: "จำเป็น",
      filterable: "ใช้กรอง",
      actions: "ตัวเลือกเพิ่มเติม",
    },
  },

  defaultGameId: "pokemon",

  games: [
    {
      id: "pokemon",
      name: "Pokémon",
      cardCount: "8,420",
      fields: [
        {
          id: "pokemon-hp",
          label: "HP",
          type: "number",
          sample: "60 / 120 / 340",
          required: true,
          filterable: true,
        },
        {
          id: "pokemon-card-type",
          label: "Card Type",
          type: "enum",
          sample: "Fire, Water, Grass, ...",
          required: true,
          filterable: true,
        },
        {
          id: "pokemon-rarity",
          label: "Rarity",
          type: "enum",
          sample: "Common, Rare, Secret Rare",
          required: true,
          filterable: true,
        },
        {
          id: "pokemon-set-number",
          label: "Set Number",
          type: "text",
          sample: "054/197",
          required: true,
          filterable: false,
        },
        {
          id: "pokemon-illustrator",
          label: "Illustrator",
          type: "text",
          sample: "Mitsuhiro Arita",
          required: false,
          filterable: false,
        },
        {
          id: "pokemon-retreat-cost",
          label: "Retreat Cost",
          type: "number",
          sample: "0 – 4",
          required: false,
          filterable: true,
        },
        {
          id: "pokemon-is-holographic",
          label: "Is Holographic",
          type: "boolean",
          sample: "ใช่ / ไม่ใช่",
          required: false,
          filterable: true,
        },
        {
          id: "pokemon-regulation-mark",
          label: "Regulation Mark",
          type: "text",
          sample: "G / H",
          required: false,
          filterable: false,
        },
      ],
    },
    {
      id: "one-piece",
      name: "One Piece",
      cardCount: "4,190",
      fields: [
        {
          id: "one-piece-card-type",
          label: "Card Type",
          type: "enum",
          sample: "Leader, Character, Event, Stage",
          required: true,
          filterable: true,
        },
        {
          id: "one-piece-color",
          label: "Color",
          type: "enum",
          sample: "Red, Green, Blue, Purple, ...",
          required: true,
          filterable: true,
        },
        {
          id: "one-piece-cost",
          label: "Cost",
          type: "number",
          sample: "0 – 10",
          required: true,
          filterable: true,
        },
        {
          id: "one-piece-power",
          label: "Power",
          type: "number",
          sample: "1000 / 5000 / 10000",
          required: false,
          filterable: true,
        },
        {
          id: "one-piece-counter",
          label: "Counter",
          type: "number",
          sample: "1000 / 2000",
          required: false,
          filterable: false,
        },
        {
          id: "one-piece-set-number",
          label: "Set Number",
          type: "text",
          sample: "OP01-001",
          required: true,
          filterable: false,
        },
      ],
    },
    {
      id: "mtg",
      name: "Magic: The Gathering",
      cardCount: "3,510",
      fields: [
        {
          id: "mtg-mana-cost",
          label: "Mana Cost",
          type: "text",
          sample: "{2}{U}{U}",
          required: true,
          filterable: true,
        },
        {
          id: "mtg-card-type",
          label: "Card Type",
          type: "enum",
          sample: "Creature, Instant, Land, ...",
          required: true,
          filterable: true,
        },
        {
          id: "mtg-rarity",
          label: "Rarity",
          type: "enum",
          sample: "Common, Uncommon, Rare, Mythic",
          required: true,
          filterable: true,
        },
        {
          id: "mtg-power-toughness",
          label: "Power / Toughness",
          type: "text",
          sample: "3 / 4",
          required: false,
          filterable: true,
        },
        {
          id: "mtg-set-code",
          label: "Set Code",
          type: "text",
          sample: "MOM · 121",
          required: true,
          filterable: false,
        },
        {
          id: "mtg-artist",
          label: "Artist",
          type: "text",
          sample: "Rebecca Guay",
          required: false,
          filterable: false,
        },
        {
          id: "mtg-is-foil",
          label: "Is Foil",
          type: "boolean",
          sample: "ใช่ / ไม่ใช่",
          required: false,
          filterable: true,
        },
      ],
    },
    {
      id: "yugioh",
      name: "Yu-Gi-Oh!",
      cardCount: "2,180",
      fields: [
        {
          id: "yugioh-card-type",
          label: "Card Type",
          type: "enum",
          sample: "Monster, Spell, Trap",
          required: true,
          filterable: true,
        },
        {
          id: "yugioh-attribute",
          label: "Attribute",
          type: "enum",
          sample: "DARK, LIGHT, WATER, ...",
          required: false,
          filterable: true,
        },
        {
          id: "yugioh-level",
          label: "Level / Rank",
          type: "number",
          sample: "1 – 12",
          required: false,
          filterable: true,
        },
        {
          id: "yugioh-atk-def",
          label: "ATK / DEF",
          type: "text",
          sample: "2500 / 2100",
          required: false,
          filterable: false,
        },
        {
          id: "yugioh-set-number",
          label: "Set Number",
          type: "text",
          sample: "LOB-EN001",
          required: true,
          filterable: false,
        },
      ],
    },
    {
      id: "sports",
      name: "Sports Cards",
      cardCount: "640",
      fields: [
        {
          id: "sports-sport",
          label: "Sport",
          type: "enum",
          sample: "Basketball, Football, Baseball",
          required: true,
          filterable: true,
        },
        {
          id: "sports-player",
          label: "Player",
          type: "text",
          sample: "LeBron James",
          required: true,
          filterable: true,
        },
        {
          id: "sports-season",
          label: "Season",
          type: "text",
          sample: "2023-24",
          required: true,
          filterable: true,
        },
        {
          id: "sports-is-graded",
          label: "Is Graded",
          type: "boolean",
          sample: "ใช่ / ไม่ใช่",
          required: false,
          filterable: true,
        },
      ],
    },
  ],
};

export const ADMIN_SELLER_APPROVAL_FIXTURE: AdminSellerApprovalData = {
  title: "อนุมัติผู้ขาย",
  subtitle: "ตรวจสอบเอกสาร KYC ก่อนอนุญาตให้เปิดร้านค้าบนแพลตฟอร์ม",
  exportLabel: "ส่งออกรายชื่อ",

  stats: [
    {
      id: "pending",
      label: "รอตรวจสอบ",
      value: "19",
      tone: "pending",
      emphasis: true,
    },
    { id: "approved", label: "อนุมัติแล้ว", value: "214", tone: "approved" },
    { id: "rejected", label: "ปฏิเสธ", value: "6", tone: "rejected" },
    { id: "total", label: "ทั้งหมด", value: "239", tone: "total" },
  ],

  queue: {
    title: "คิวรอตรวจสอบ",
    sortLabel: "เรียงตาม: เก่าสุด",
    viewingLabel: "กำลังดู",
  },

  documentsTitle: "เอกสารที่แนบมา",
  documentHint: "คลิกเพื่อดูขนาดเต็ม",
  reviewTitle: "ผลการตรวจสอบ",

  actions: {
    requestMore: "ขอเอกสารเพิ่ม",
    reject: "ปฏิเสธคำขอ",
    approve: "อนุมัติเปิดร้าน",
  },

  defaultApplicationId: "minmin-tcg",

  applications: [
    {
      id: "minmin-tcg",
      handle: "minmin_tcg",
      initials: "MT",
      avatarAccent: "teal",
      submittedAt: "ส่งเมื่อ 5 นาทีที่แล้ว",
      documentTags: ["บัตรประชาชน", "สมุดบัญชี"],
      statusLabel: "รอตรวจสอบ",
      statusTone: "pending",
      contactLine:
        "สมัครเมื่อ 14 ส.ค. 2569 · อีเมล minmin@example.com · โทร 08x-xxx-4821",
      details: [
        { label: "ชื่อร้านค้า", value: "minmin_tcg Cards" },
        { label: "ชื่อ-นามสกุล (ตามบัตร)", value: "มินตรา ทองสุข" },
        { label: "เลขบัตรประชาชน", value: "1-1010-0xxxx-xx-x" },
        { label: "ธนาคาร", value: "กสิกรไทย · xxx-x-x1234-5" },
        {
          label: "ที่อยู่จัดส่งคืน",
          value: "123 ถ.สุขุมวิท คลองเตย กทม. 10110",
        },
        { label: "ประเภทการ์ดที่จะขาย", value: "Pokémon, One Piece" },
      ],
      documents: [
        { id: "id-card", title: "บัตรประชาชน", meta: "ด้านหน้า · 1.2 MB" },
        { id: "bankbook", title: "สมุดบัญชีธนาคาร", meta: "หน้าแรก · 840 KB" },
        {
          id: "selfie",
          title: "เซลฟี่คู่บัตร",
          meta: "ตรวจสอบใบหน้า · 1.6 MB",
        },
      ],
      review: "เอกสารครบถ้วน ชื่อบัญชีตรงกับบัตรประชาชน",
    },
    {
      id: "nattapong-p",
      handle: "nattapong_p",
      initials: "NP",
      avatarAccent: "primary",
      submittedAt: "ส่งเมื่อ 2 ชม. ที่แล้ว",
      documentTags: ["บัตรประชาชน"],
      statusLabel: "รอตรวจสอบ",
      statusTone: "pending",
      contactLine:
        "สมัครเมื่อ 12 ส.ค. 2569 · อีเมล nattapong@example.com · โทร 08x-xxx-1173",
      details: [
        { label: "ชื่อร้านค้า", value: "Nattapong Singles" },
        { label: "ชื่อ-นามสกุล (ตามบัตร)", value: "ณัฐพงศ์ ประเสริฐ" },
        { label: "เลขบัตรประชาชน", value: "3-1002-0xxxx-xx-x" },
        { label: "ธนาคาร", value: "ไทยพาณิชย์ · xxx-x-x8842-1" },
        {
          label: "ที่อยู่จัดส่งคืน",
          value: "45/2 ถ.พหลโยธิน จตุจักร กทม. 10900",
        },
        { label: "ประเภทการ์ดที่จะขาย", value: "Pokémon" },
      ],
      documents: [
        { id: "id-card", title: "บัตรประชาชน", meta: "ด้านหน้า · 980 KB" },
      ],
      review: "ยังไม่แนบสมุดบัญชี — ต้องขอเอกสารเพิ่มก่อนอนุมัติ",
    },
    {
      id: "tcg-bangkok",
      handle: "tcg.bangkok",
      initials: "TB",
      avatarAccent: "amber",
      submittedAt: "ส่งเมื่อ 5 ชม. ที่แล้ว",
      documentTags: ["บัตรประชาชน", "สมุดบัญชี", "ทะเบียนพาณิชย์"],
      statusLabel: "รอตรวจสอบ",
      statusTone: "pending",
      contactLine:
        "สมัครเมื่อ 11 ส.ค. 2569 · อีเมล contact@tcgbangkok.co.th · โทร 02-xxx-7710",
      details: [
        { label: "ชื่อร้านค้า", value: "TCG Bangkok" },
        { label: "ชื่อ-นามสกุล (ตามบัตร)", value: "ธนกฤต บุญมาก" },
        { label: "เลขบัตรประชาชน", value: "1-1005-0xxxx-xx-x" },
        { label: "ธนาคาร", value: "กรุงเทพ · xxx-x-x0157-9" },
        {
          label: "ที่อยู่จัดส่งคืน",
          value: "88 ถ.เยาวราช สัมพันธวงศ์ กทม. 10100",
        },
        { label: "ประเภทการ์ดที่จะขาย", value: "Pokémon, One Piece, Yu-Gi-Oh!" },
      ],
      documents: [
        { id: "id-card", title: "บัตรประชาชน", meta: "ด้านหน้า · 1.1 MB" },
        { id: "bankbook", title: "สมุดบัญชีธนาคาร", meta: "หน้าแรก · 760 KB" },
        {
          id: "registration",
          title: "ทะเบียนพาณิชย์",
          meta: "นิติบุคคล · 2.4 MB",
        },
      ],
      review: "เอกสารครบถ้วน จดทะเบียนในนามนิติบุคคล",
    },
    {
      id: "cardsdeal-th",
      handle: "cardsdeal.th",
      initials: "CD",
      avatarAccent: "primary",
      submittedAt: "ส่งเมื่อวานนี้",
      documentTags: ["บัตรประชาชน", "สมุดบัญชี"],
      statusLabel: "รอตรวจสอบ",
      statusTone: "pending",
      contactLine:
        "สมัครเมื่อ 10 ส.ค. 2569 · อีเมล hello@cardsdeal.th · โทร 09x-xxx-3306",
      details: [
        { label: "ชื่อร้านค้า", value: "Cardsdeal TH" },
        { label: "ชื่อ-นามสกุล (ตามบัตร)", value: "ศิริพร วงศ์อารีย์" },
        { label: "เลขบัตรประชาชน", value: "1-5099-0xxxx-xx-x" },
        { label: "ธนาคาร", value: "กรุงไทย · xxx-x-x4420-3" },
        {
          label: "ที่อยู่จัดส่งคืน",
          value: "9/14 ถ.นิมมานเหมินท์ เมือง เชียงใหม่ 50200",
        },
        { label: "ประเภทการ์ดที่จะขาย", value: "Magic: The Gathering" },
      ],
      documents: [
        { id: "id-card", title: "บัตรประชาชน", meta: "ด้านหน้า · 1.4 MB" },
        { id: "bankbook", title: "สมุดบัญชีธนาคาร", meta: "หน้าแรก · 910 KB" },
      ],
      review: "ชื่อบัญชีสะกดต่างจากบัตรเล็กน้อย — ควรขอเอกสารยืนยันเพิ่ม",
    },
    {
      id: "rare-gems",
      handle: "rare.gems",
      initials: "RG",
      avatarAccent: "red",
      submittedAt: "ส่งเมื่อ 2 วันที่แล้ว",
      documentTags: ["บัตรประชาชน"],
      statusLabel: "รอตรวจสอบ",
      statusTone: "pending",
      contactLine:
        "สมัครเมื่อ 9 ส.ค. 2569 · อีเมล raregems@example.com · โทร 08x-xxx-9925",
      details: [
        { label: "ชื่อร้านค้า", value: "Rare Gems Collectibles" },
        { label: "ชื่อ-นามสกุล (ตามบัตร)", value: "กิตติพงษ์ แสงทอง" },
        { label: "เลขบัตรประชาชน", value: "2-3001-0xxxx-xx-x" },
        { label: "ธนาคาร", value: "กสิกรไทย · xxx-x-x7731-8" },
        {
          label: "ที่อยู่จัดส่งคืน",
          value: "212 ถ.มิตรภาพ เมือง ขอนแก่น 40000",
        },
        { label: "ประเภทการ์ดที่จะขาย", value: "Sports Cards" },
      ],
      documents: [
        { id: "id-card", title: "บัตรประชาชน", meta: "ด้านหน้า · 1.0 MB" },
      ],
      review: "รูปบัตรเบลอบางส่วน อ่านเลขบัตรไม่ชัด",
    },
  ],
};
