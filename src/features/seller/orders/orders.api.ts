import type { OrdersData } from "./orders.types";

/**
 * ข้อมูลตัวอย่างของหน้า "จัดการคำสั่งซื้อ" — ลอกข้อความและตัวเลขจาก
 * Figma node 432:7629 เพื่อให้เทียบหน้าจอกับดีไซน์ได้ตรง ๆ
 *
 * หมายเหตุ: ในดีไซน์มีแต่ออเดอร์สถานะ "รอแพ็ค" และเห็นรายการสินค้าแค่ใบแรก
 * ที่นี่เติมรายการสินค้าให้ใบที่เหลือ (ยอดรวมตรงกับดีไซน์) และเพิ่มออเดอร์
 * สถานะอื่นให้กดชิปตัวกรองแล้วเห็นผลจริงทุกอัน — เลขออเดอร์/ผู้ซื้อบางใบ
 * ตรงกับการ์ดคำสั่งซื้อล่าสุดในหน้าแดชบอร์ด
 */
const ORDERS_MOCK: OrdersData = {
  title: "จัดการคำสั่งซื้อ",
  subtitle:
    "8 ออเดอร์รอแพ็ค · 34 กำลังจัดส่ง · จัดส่งภายใน 2 วันเพื่อรักษาคะแนนร้าน",

  actions: {
    printAllLabel: "พิมพ์ใบปะหน้าทั้งหมด",
    updateStatusLabel: "อัปเดตสถานะ",
  },

  filters: [
    { id: "awaiting_pack", label: "รอแพ็ค", count: 8 },
    { id: "awaiting_payment", label: "รอชำระ", count: 5 },
    { id: "shipped", label: "กำลังจัดส่ง", count: 34 },
    { id: "completed", label: "สำเร็จ", count: 210 },
    { id: "cancelled", label: "ยกเลิก", count: 4 },
  ],

  sort: {
    placeholder: "เรียง: เก่าสุดก่อน",
    options: [
      { value: "oldest", label: "เรียง: เก่าสุดก่อน" },
      { value: "newest", label: "เรียง: ใหม่สุดก่อน" },
      { value: "total-desc", label: "เรียง: ยอดสูง-ต่ำ" },
    ],
  },

  card: {
    selectLabel: "เลือกคำสั่งซื้อ",
    addressTitle: "ที่อยู่จัดส่ง",
    trackingPlaceholder: "กรอกเลขพัสดุ",
    carrierPlaceholder: "เลือกขนส่ง",
    carriers: [
      { value: "kerry", label: "Kerry Express" },
      { value: "flash", label: "Flash Express" },
      { value: "jt", label: "J&T Express" },
      { value: "thaipost-ems", label: "ไปรษณีย์ไทย EMS" },
    ],
    printLabel: "พิมพ์ใบปะหน้า",
    confirmLabel: "ยืนยันจัดส่ง",
    shipmentTitle: "เลขพัสดุ",
  },

  orders: [
    {
      id: "ORD-10241",
      buyer: "nattapong_p",
      orderedAtLabel: "สั่งเมื่อ 2 ชม. ที่แล้ว",
      total: "฿1,850",
      status: "awaiting_pack",
      payment: { status: "paid", label: "ชำระแล้ว" },
      urgentLabel: "ใกล้เกินกำหนด",
      lines: [
        {
          id: "charizard-ex",
          kind: "product",
          name: "Charizard ex — Obsidian Flames",
          meta: "Near Mint ×1",
          price: "฿1,290",
        },
        {
          id: "sv-pack",
          kind: "product",
          name: "Scarlet & Violet Pack",
          meta: "ซีลปิด ×2",
          price: "฿360",
        },
        { id: "shipping", kind: "shipping", name: "ค่าจัดส่ง EMS", price: "฿200" },
      ],
      address:
        "นายณัฐพงษ์ พ. · 88/12 ซ.ลาดพร้าว 15 จตุจักร กทม. 10900 · 08x-xxx-1147",
    },
    {
      id: "ORD-10239",
      buyer: "rare.gems",
      orderedAtLabel: "สั่งเมื่อ 5 ชม. ที่แล้ว",
      total: "฿920",
      status: "awaiting_pack",
      payment: { status: "paid", label: "ชำระแล้ว" },
      lines: [
        {
          id: "sv-pack",
          kind: "product",
          name: "Scarlet & Violet Pack",
          meta: "ซีลปิด ×4",
          price: "฿720",
        },
        { id: "shipping", kind: "shipping", name: "ค่าจัดส่ง EMS", price: "฿200" },
      ],
      address:
        "น.ส.พิมพ์ชนก ร. · 45 ถ.นิมมานเหมินท์ สุเทพ เมืองเชียงใหม่ 50200 · 09x-xxx-3382",
    },
    {
      id: "ORD-10236",
      buyer: "cardsdeal.th",
      orderedAtLabel: "สั่งเมื่อ 8 ชม. ที่แล้ว",
      total: "฿3,410",
      status: "awaiting_pack",
      payment: { status: "paid", label: "ชำระแล้ว" },
      lines: [
        {
          id: "charizard-ex",
          kind: "product",
          name: "Charizard ex — Obsidian Flames",
          meta: "Near Mint ×1",
          price: "฿1,290",
        },
        {
          id: "luffy-gear-5",
          kind: "product",
          name: "Luffy Gear 5 — Leader Parallel",
          meta: "Near Mint ×1",
          price: "฿1,650",
        },
        {
          id: "sv-pack",
          kind: "product",
          name: "Scarlet & Violet Pack",
          meta: "ซีลปิด ×2",
          price: "฿360",
        },
        {
          id: "shipping",
          kind: "shipping",
          name: "ค่าจัดส่ง Kerry Express",
          price: "฿110",
        },
      ],
      address:
        "คุณธนากร ศ. · 199/7 ถ.พระราม 9 ห้วยขวาง กทม. 10310 · 06x-xxx-9021",
    },
    {
      id: "ORD-10234",
      buyer: "pika.hunter",
      orderedAtLabel: "สั่งเมื่อวานนี้",
      total: "฿1,240",
      status: "awaiting_pack",
      payment: { status: "paid", label: "ชำระแล้ว" },
      lines: [
        {
          id: "gengar-vmax",
          kind: "product",
          name: "Gengar VMAX — Full Art",
          meta: "Lightly Played ×1",
          price: "฿1,120",
        },
        {
          id: "shipping",
          kind: "shipping",
          name: "ค่าจัดส่ง Flash Express",
          price: "฿120",
        },
      ],
      address:
        "นายกิตติพัฒน์ ม. · 12 ม.3 ต.บ้านสวน เมืองชลบุรี 20000 · 08x-xxx-5510",
    },
    {
      id: "ORD-10244",
      buyer: "tcg.bkk",
      orderedAtLabel: "สั่งเมื่อ 20 นาทีที่แล้ว",
      total: "฿1,490",
      status: "awaiting_payment",
      payment: { status: "pending", label: "รอชำระ" },
      lines: [
        {
          id: "charizard-ex",
          kind: "product",
          name: "Charizard ex — Obsidian Flames",
          meta: "Near Mint ×1",
          price: "฿1,290",
        },
        { id: "shipping", kind: "shipping", name: "ค่าจัดส่ง EMS", price: "฿200" },
      ],
      address:
        "คุณวรเมธ ต. · 7/3 ซ.อารีย์ 2 พญาไท กทม. 10400 · 08x-xxx-7734",
    },
    {
      id: "ORD-10233",
      buyer: "sora.trades",
      orderedAtLabel: "สั่งเมื่อวานนี้",
      total: "฿640",
      status: "awaiting_payment",
      payment: { status: "pending", label: "รอชำระ" },
      lines: [
        {
          id: "pikachu-vmax",
          kind: "product",
          name: "Pikachu VMAX — Rainbow Rare",
          meta: "Lightly Played ×1",
          price: "฿540",
        },
        {
          id: "shipping",
          kind: "shipping",
          name: "ค่าจัดส่ง ไปรษณีย์ไทย",
          price: "฿100",
        },
      ],
      address:
        "น.ส.โสรยา ก. · 301 ถ.มิตรภาพ ในเมือง เมืองขอนแก่น 40000 · 09x-xxx-6645",
    },
    {
      id: "ORD-10238",
      buyer: "kandypop",
      orderedAtLabel: "สั่งเมื่อ 6 ชม. ที่แล้ว",
      total: "฿3,420",
      status: "shipped",
      payment: { status: "paid", label: "ชำระแล้ว" },
      lines: [
        {
          id: "luffy-gear-5",
          kind: "product",
          name: "Luffy Gear 5 — Leader Parallel",
          meta: "Near Mint ×2",
          price: "฿3,300",
        },
        {
          id: "shipping",
          kind: "shipping",
          name: "ค่าจัดส่ง Kerry Express",
          price: "฿120",
        },
      ],
      address:
        "คุณแคนดี้ ป. · 56/88 ถ.แจ้งวัฒนะ ปากเกร็ด นนทบุรี 11120 · 08x-xxx-2290",
      shipment: { carrier: "Kerry Express", trackingNumber: "KEX0012845731" },
    },
    {
      id: "ORD-10231",
      buyer: "luna.cards",
      orderedAtLabel: "สั่งเมื่อ 2 วันที่แล้ว",
      total: "฿2,650",
      status: "shipped",
      payment: { status: "paid", label: "ชำระแล้ว" },
      lines: [
        {
          id: "pikachu-vmax",
          kind: "product",
          name: "Pikachu VMAX — Rainbow Rare",
          meta: "Near Mint ×1",
          price: "฿2,450",
        },
        { id: "shipping", kind: "shipping", name: "ค่าจัดส่ง EMS", price: "฿200" },
      ],
      address:
        "น.ส.ลลิตา ส. · 9 ถ.ราชดำเนิน ในเมือง เมืองนครศรีธรรมราช 80000 · 06x-xxx-4418",
      shipment: { carrier: "ไปรษณีย์ไทย EMS", trackingNumber: "EF582913406TH" },
    },
    {
      id: "ORD-10229",
      buyer: "pika.hunter",
      orderedAtLabel: "สั่งเมื่อ 3 วันที่แล้ว",
      total: "฿990",
      status: "completed",
      payment: { status: "paid", label: "ชำระแล้ว" },
      lines: [
        {
          id: "mewtwo-v-alt-art",
          kind: "product",
          name: "Mewtwo V — Alt Art",
          meta: "Lightly Played ×1",
          price: "฿890",
        },
        {
          id: "shipping",
          kind: "shipping",
          name: "ค่าจัดส่ง Flash Express",
          price: "฿100",
        },
      ],
      address:
        "นายกิตติพัฒน์ ม. · 12 ม.3 ต.บ้านสวน เมืองชลบุรี 20000 · 08x-xxx-5510",
      shipment: { carrier: "Flash Express", trackingNumber: "TH0147852369" },
    },
    {
      id: "ORD-10227",
      buyer: "jirayu.k",
      orderedAtLabel: "สั่งเมื่อ 4 วันที่แล้ว",
      total: "฿4,890",
      status: "cancelled",
      payment: { status: "refunded", label: "คืนเงินแล้ว" },
      lines: [
        {
          id: "paldea-box",
          kind: "product",
          name: "Paldea Evolved Booster Box",
          meta: "ซีลปิด ×1",
          price: "฿4,690",
        },
        {
          id: "shipping",
          kind: "shipping",
          name: "ค่าจัดส่ง Kerry Express",
          price: "฿200",
        },
      ],
      address:
        "นายจิรายุ ค. · 22 ถ.สุขุมวิท 101 บางจาก พระโขนง กทม. 10260 · 08x-xxx-8803",
    },
  ],

  steps: {
    title: "ขั้นตอนการจัดส่ง",
    items: [
      { id: "verify-payment", label: "ตรวจสอบการชำระเงิน", done: true },
      { id: "pack", label: "แพ็คการ์ดด้วย Top Loader", done: true },
      { id: "photo", label: "ถ่ายรูปก่อนปิดกล่อง", done: false },
      { id: "tracking", label: "กรอกเลขพัสดุในระบบ", done: false },
      { id: "confirm", label: "กดยืนยันจัดส่ง", done: false },
    ],
  },

  summary: {
    title: "ผลประกอบการเดือนนี้",
    rows: [
      { id: "sales", label: "ยอดขายรวม", value: "฿24,850", tone: "default" },
      { id: "cost", label: "ต้นทุนสินค้า", value: "− ฿16,420", tone: "muted" },
      {
        id: "commission",
        label: "ค่าคอมมิชชั่น 5%",
        value: "− ฿1,242",
        tone: "muted",
      },
    ],
    netLabel: "กำไรสุทธิ",
    netValue: "฿7,188",
  },

  tip: {
    title: "เคล็ดลับ",
    description:
      "ร้านที่จัดส่งภายใน 24 ชม. ได้คะแนนรีวิวเฉลี่ยสูงกว่า 0.4 ดาว และมีโอกาสขายซ้ำมากกว่า 2 เท่า",
  },
};

/**
 * จุดต่อข้อมูลของหน้าจัดการคำสั่งซื้อ — ตอนนี้คืนข้อมูลจำลอง
 * วันที่ต่อ API จริงให้แก้เฉพาะข้างในฟังก์ชันนี้ component ทุกตัวไม่ต้องแตะ
 */
export function getOrdersData(): OrdersData {
  return ORDERS_MOCK;
}
