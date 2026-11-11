# Glossary (TH ↔ EN)

Use these terms everywhere in `src/i18n/*` and in Tolgee [TCG-560].

| ไทย | English |
|---|---|
| ผู้ขาย | Seller |
| คำสั่งซื้อ | Order |
| สลิป | Payment slip |
| ถอนเงิน (คำนาม: คำขอถอนเงิน) | Payout (payout request) |
| ค่าคอมมิชชั่น | Commission |
| สภาพการ์ด | Condition |
| โปรโมชัน | Promotion |
| โค้ดส่วนลด | Discount code |
| เก็บโค้ด | Claim code (button: Collect) |
| โค้ดของฉัน | My Codes |
| ลดราคา | Sale |
| ประมูล | Auction |
| ลงราคาบิด | Bid |
| ซื้อทันที | Buy Now |
| ตะกร้า | Cart |

Do not translate: NM / LP / MP / HP / DMG, Flash Sale, game names, card names, PEGASUS / Pegasus TCG, SKU, Cert.

Spelling in Thai: `โปรโมชัน` (not โปรโมชั่น), `ค่าคอมมิชชั่น` (not คอมมิชชัน).

Thai has only the ICU `other` plural form. Write `{count, plural, other {…}}` in `th.json`, and `one` / `other` (or `=1` / `other`) in `en.json`.
